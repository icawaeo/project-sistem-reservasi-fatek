import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { validateReservationLeadTimeYMD } from "@/lib/reservation-policy";
import { getReservationMinDaysAheadExclusive } from "@/lib/reservation-settings";
import { validateBuildingOperationalWindow } from "@/lib/building-operational-policy";
import {
  getDailyReservationSlots,
  rangesConflictByDailySlots,
  RESERVATION_BUFFER_MS,
} from "@/lib/reservation-slots";
import { getRequestLogMeta, logServerError } from "@/lib/server-logger";
import { sendNotification } from "@/lib/notificationService";
import { formatWitaDateYMD, getWitaDateTimeParts } from "@/lib/timezone";

import { isLabBuilding } from "@/app/utils/building";

type IncomingReservationFlow = "GENERAL" | "LAB_SKRIPSI" | "LAB_LAINNYA";

type ReservationConflictCandidate = {
  res_startTime: Date;
  res_endTime: Date;
};

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

/**
 * Generate array of date strings (YYYY-MM-DD) from start to end (inclusive).
 */
const getDateRange = (startDateYmd: string, endDateYmd: string): string[] => {
  const dates: string[] = [];
  const current = new Date(`${startDateYmd}T00:00:00Z`);
  const endDate = new Date(`${endDateYmd}T00:00:00Z`);

  while (current <= endDate) {
    const yyyy = current.getUTCFullYear();
    const mm = String(current.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(current.getUTCDate()).padStart(2, "0");
    dates.push(`${yyyy}-${mm}-${dd}`);
    current.setUTCDate(current.getUTCDate() + 1);
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
    const manualIdentifier = typeof body.borrower_identifier === "string" ? body.borrower_identifier.trim() : "";

    const currentUser = await prisma.user.findUnique({
      where: { user_id: session.user.id },
      select: { identifier: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const currentIdentifier = currentUser.identifier?.trim() ?? "";
    const shouldSaveManualIdentifier = !currentIdentifier;

    if (shouldSaveManualIdentifier) {
      if (!manualIdentifier) {
        return NextResponse.json({ error: "NIM/NIP wajib diisi." }, { status: 400 });
      }

      if (!/^\d+$/.test(manualIdentifier)) {
        return NextResponse.json({ error: "NIM/NIP hanya boleh berisi angka." }, { status: 400 });
      }
    }

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

    const documentUrl = typeof body.res_documentUrl === "string" ? body.res_documentUrl.trim() : "";
    if (!documentUrl) {
      return NextResponse.json({ error: "Dokumen pendukung wajib diunggah." }, { status: 400 });
    }

    const resStart = new Date(body.res_startTime);
    const resEnd = new Date(body.res_endTime);

    if (Number.isNaN(resStart.getTime()) || Number.isNaN(resEnd.getTime())) {
      return NextResponse.json({ error: "Format tanggal/waktu tidak valid" }, { status: 400 });
    }

    if (resEnd <= resStart) {
      return NextResponse.json({ error: "Jam selesai tidak boleh lebih awal dari jam mulai." }, { status: 400 });
    }

    const startWita = getWitaDateTimeParts(resStart);
    const endWita = getWitaDateTimeParts(resEnd);

    const minDaysAheadExclusive = await getReservationMinDaysAheadExclusive();
    const leadTimeCheck = validateReservationLeadTimeYMD(startWita.date, {
      minDaysAheadExclusive,
      now: new Date(`${formatWitaDateYMD(new Date())}T00:00:00`),
    });
    if (!leadTimeCheck.ok) {
      return NextResponse.json(
        {
          error: `Reservasi hanya dapat dilakukan minimal H-${minDaysAheadExclusive}. Silakan pilih tanggal mulai ${leadTimeCheck.earliestAllowedDateYMD}.`,
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

    const building = await prisma.building.findUnique({
      where: { building_name: room.room_building },
      select: {
        operational_days: true,
        open_time: true,
        close_time: true,
        building_isActive: true,
      },
    });

    if (!building || !building.building_isActive) {
      return NextResponse.json({ error: "Gedung tidak ditemukan atau tidak aktif" }, { status: 404 });
    }

    const reservationDates = getDateRange(startWita.date, endWita.date);
    const startTime = startWita.time;
    const endTime = endWita.time;
    const operationalCheck = validateBuildingOperationalWindow({
      startDate: reservationDates[0],
      endDate: reservationDates[reservationDates.length - 1],
      startTime,
      endTime,
      schedule: building,
    });

    if (!operationalCheck.ok) {
      return NextResponse.json({ error: operationalCheck.error }, { status: 400 });
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

    const dailySlots = getDailyReservationSlots({
      startTime: resStart,
      endTime: resEnd,
    });

    if (dailySlots.length === 0) {
      return NextResponse.json({ error: "Rentang tanggal/waktu tidak valid" }, { status: 400 });
    }

    const firstRequestedSlot = dailySlots[0];
    const lastRequestedSlot = dailySlots[dailySlots.length - 1];
    const possibleConflicts = await prisma.reservation.findMany({
      where: {
        room_id: room.room_id,
        res_status: { notIn: INACTIVE_STATUSES },
        res_startTime: { lt: new Date(lastRequestedSlot.end.getTime() + RESERVATION_BUFFER_MS) },
        res_endTime: { gt: new Date(firstRequestedSlot.start.getTime() - RESERVATION_BUFFER_MS) },
      },
      select: {
        res_startTime: true,
        res_endTime: true,
      },
    });

    const conflictingReservation = (possibleConflicts as ReservationConflictCandidate[]).find((existing) =>
      rangesConflictByDailySlots(
        { startTime: resStart, endTime: resEnd },
        { startTime: existing.res_startTime, endTime: existing.res_endTime },
      ),
    );

    if (conflictingReservation) {
      const conflictSlot = dailySlots.find((slot) =>
        getDailyReservationSlots({
          startTime: conflictingReservation.res_startTime,
          endTime: conflictingReservation.res_endTime,
        }).some((existingSlot) =>
          slot.date === existingSlot.date &&
          slot.start.getTime() < existingSlot.end.getTime() + RESERVATION_BUFFER_MS &&
          slot.end.getTime() > existingSlot.start.getTime() - RESERVATION_BUFFER_MS
        ),
      );

      const conflictDate = (conflictSlot?.start ?? firstRequestedSlot.start).toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      return NextResponse.json(
        {
          error: `Ruangan sudah dipesan atau masih dalam jeda 2 jam pada ${conflictDate}. Silakan pilih jadwal atau ruangan lain.`,
        },
        { status: 409 },
      );
    }

    if (shouldSaveManualIdentifier) {
      await prisma.user.update({
        where: { user_id: session.user.id },
        data: { identifier: manualIdentifier },
      });
    }

    const firstReservation = await prisma.reservation.create({
      data: {
        room_id: room.room_id,
        user_id: session.user.id,
        res_startTime: resStart,
        res_endTime: resEnd,
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
    });

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
        ? `${dailySlots[0].date} s/d ${dailySlots[dailySlots.length - 1].date} (${dailySlots.length} hari)`
        : dailySlots[0].date;

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
