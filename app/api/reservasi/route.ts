import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { validateReservationLeadTimeDate } from "@/lib/reservation-policy";
import { getRequestLogMeta, logServerError } from "@/lib/server-logger";
import { sendNotification } from "@/lib/notificationService";

import { isLabBuilding } from "@/app/utils/building";

type IncomingReservationFlow = "GENERAL" | "LAB_SKRIPSI" | "LAB_LAINNYA";

const normalizeFlow = (value: unknown): IncomingReservationFlow | null => {
  if (typeof value !== "string") return null;
  const normalized = value.toUpperCase();
  if (normalized === "GENERAL" || normalized === "LAB_SKRIPSI" || normalized === "LAB_LAINNYA") {
    return normalized as IncomingReservationFlow;
  }
  return null;
};

const allowedSortValues = new Set(["newest", "oldest"]);

// Status reservasi yang sudah tidak aktif (tidak memblokir slot ruangan)
const INACTIVE_STATUSES = [
  "REJECTED", "REJECTED_KABAG", "REJECTED_DEKAN",
  "REJECTED_WD2", "REJECTED_KAJUR", "REJECTED_KEPALA_LAB",
  "COMPLETED", "CANCELLED",
];

// Buffer 2 jam setelah reservasi selesai
const BUFFER_MS = 2 * 60 * 60 * 1000;

/**
 * Generate array of date strings (YYYY-MM-DD) from start to end (inclusive).
 */
const getDateRange = (start: Date, end: Date): string[] => {
  const dates: string[] = [];
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, "0");
    const dd = String(current.getDate()).padStart(2, "0");
    dates.push(`${yyyy}-${mm}-${dd}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sortQuery = searchParams.get("sort") || "newest";
    const sort = allowedSortValues.has(sortQuery) ? sortQuery : "newest";

    const reservations = await prisma.reservation.findMany({
      where: {
        user_id: session.user.id,
      },
      include: {
        room: true,
      },
      orderBy: {
        res_startTime: sort === "oldest" ? "asc" : "desc",
      },
    });

    return NextResponse.json({
      reservations,
      sort,
    });
  } catch (error) {
    logServerError("[api/reservasi] Failed to fetch reservation history", error, getRequestLogMeta(request));
    return NextResponse.json({ error: "Gagal mengambil riwayat reservasi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Cek apakah user masih memiliki reservasi aktif (PENDING atau APPROVED belum selesai)
    const activeReservation = await prisma.reservation.findFirst({
      where: {
        user_id: session.user.id,
        OR: [
          {
            res_status: {
              in: [
                "PENDING", "PENDING_KABAG", "PENDING_DEKAN",
                "PENDING_WD2", "PENDING_WAKIL_DEKAN_2",
                "PENDING_KAJUR", "PENDING_KEPALA_LAB",
              ],
            },
          },
          {
            res_status: "APPROVED",
            res_endTime: { gt: new Date() },
          },
        ],
      },
    });

    if (activeReservation) {
      return NextResponse.json(
        { error: "Anda masih memiliki pengajuan reservasi aktif yang belum selesai." },
        { status: 400 }
      );
    }

    // Validasi sederhana
    if (!body.room_id || !body.res_startTime || !body.res_endTime || !body.res_purpose) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const resStart = new Date(body.res_startTime);
    const resEnd = new Date(body.res_endTime);

    const leadTimeCheck = validateReservationLeadTimeDate(resStart);
    if (!leadTimeCheck.ok) {
      return NextResponse.json(
        {
          error: `Reservasi hanya dapat dilakukan minimal H-3. Silakan pilih tanggal mulai ${leadTimeCheck.earliestAllowedDateYMD}.`,
        },
        { status: 400 },
      );
    }

    const roomId = typeof body.room_id === "string" ? body.room_id : "";
    const room = await prisma.room.findUnique({
      where: { room_id: roomId },
      select: {
        room_id: true,
        room_isActive: true,
        room_building: true,
        labProgram: true,
        labDepartment: true,
      },
    });

    if (!room || !room.room_isActive) {
      return NextResponse.json({ error: "Ruangan tidak ditemukan atau tidak aktif" }, { status: 404 });
    }

    const isLabRoom = isLabBuilding(room.room_building);
    const requestedFlow = normalizeFlow(body.res_flow);

    let resolvedFlow: IncomingReservationFlow = "GENERAL";

    if (isLabRoom) {
      if (!requestedFlow || requestedFlow === "GENERAL") {
        return NextResponse.json(
          { error: "Kategori peminjaman lab wajib dipilih (Skripsi/Lainnya)." },
          { status: 400 }
        );
      }

      if (!room.labProgram || !room.labDepartment) {
        return NextResponse.json(
          { error: "Data ruangan lab belum memiliki prodi/jurusan. Hubungi admin untuk melengkapi data ruangan." },
          { status: 400 }
        );
      }

		const documentUrl = typeof body.res_documentUrl === "string" ? body.res_documentUrl.trim() : "";
		if (!documentUrl) {
			return NextResponse.json(
				{ error: "Dokumen pendukung wajib diunggah untuk peminjaman lab." },
				{ status: 400 }
			);
		}

      resolvedFlow = requestedFlow;
    } else {
      resolvedFlow = requestedFlow ?? "GENERAL";
      if (resolvedFlow !== "GENERAL") {
        resolvedFlow = "GENERAL";
      }
    }

    // --- Pecah reservasi multi-hari menjadi reservasi harian ---
    // Ambil jam dari start dan end, lalu generate satu reservasi per hari
    const startHours = resStart.getHours();
    const startMinutes = resStart.getMinutes();
    const endHours = resEnd.getHours();
    const endMinutes = resEnd.getMinutes();

    const dateStrings = getDateRange(resStart, resEnd);

    // Buat daftar slot harian
    const dailySlots = dateStrings.map((dateStr) => {
      const dayStart = new Date(`${dateStr}T${String(startHours).padStart(2, "0")}:${String(startMinutes).padStart(2, "0")}:00`);
      const dayEnd = new Date(`${dateStr}T${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}:00`);
      return { start: dayStart, end: dayEnd };
    });

    // --- Conflict check per hari dengan buffer 2 jam ---
    // Buffer: jika reservasi lain berakhir jam 12:00, slot baru hanya bisa mulai jam 14:00
    for (const slot of dailySlots) {
      const bufferedStart = new Date(slot.start.getTime() - BUFFER_MS);

      const conflicting = await prisma.reservation.findFirst({
        where: {
          room_id: room.room_id,
          res_status: { notIn: INACTIVE_STATUSES },
          res_startTime: { lt: slot.end },
          res_endTime: { gt: bufferedStart },
        },
      });

      if (conflicting) {
        const conflictDate = slot.start.toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        return NextResponse.json(
          {
            error: `Ruangan sudah dipesan pada ${conflictDate} (${String(startHours).padStart(2, "0")}:${String(startMinutes).padStart(2, "0")} - ${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}). Silakan pilih jadwal atau ruangan lain.`,
          },
          { status: 409 }
        );
      }
    }

    // --- Buat semua reservasi harian dalam satu transaksi ---
    const createdReservations = await prisma.$transaction(
      dailySlots.map((slot) =>
        prisma.reservation.create({
          data: {
            room_id: room.room_id,
            user_id: session.user.id,
            res_startTime: slot.start,
            res_endTime: slot.end,
            res_purpose: body.res_purpose,
            res_flow: resolvedFlow,
            res_status: "PENDING",
            res_documentUrl: body.res_documentUrl || null,
            res_labProgram: isLabRoom ? room.labProgram : null,
            res_labDepartment: isLabRoom ? room.labDepartment : null,
          },
          include: {
            room: true,
            user: true,
          },
        })
      )
    );

    // Gunakan reservasi pertama untuk response dan notifikasi
    const firstReservation = createdReservations[0];

    // Send notification to Kabag (ADMIN) and Superadmin only — other roles get notified via cascade
    try {
      const admins = await prisma.user.findMany({
        where: {
          role: {
            in: ['ADMIN', 'SUPERADMIN']
          }
        },
        select: { user_id: true }
      });

      const dateLabel = dailySlots.length > 1
        ? `${dateStrings[0]} s/d ${dateStrings[dateStrings.length - 1]} (${dailySlots.length} hari)`
        : dateStrings[0];

      for (const admin of admins) {
        await sendNotification(
          admin.user_id,
          'RESERVATION_NEW',
          'Pengajuan Reservasi Baru',
          `${firstReservation.user.name} meminjam ${firstReservation.room.room_name} — ${dateLabel}`,
          { reservationId: firstReservation.res_id }
        );
      }
    } catch (error) {
      console.error('Error sending new reservation notification:', error);
    }

    return NextResponse.json(firstReservation);
  } catch (error) {
    logServerError("[api/reservasi] Failed to create reservation", error, getRequestLogMeta(request));
    return NextResponse.json({ error: "Gagal menyimpan reservasi" }, { status: 500 });
  }
}
