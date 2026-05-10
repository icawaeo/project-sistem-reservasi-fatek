import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { validateReservationLeadTimeDate } from "@/lib/reservation-policy";
import { getRequestLogMeta, logServerError } from "@/lib/server-logger";

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
          { res_status: "PENDING" },
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

    const reservasi = await prisma.reservation.create({
      data: {
        room_id: room.room_id,
        user_id: session.user.id,
        res_startTime: new Date(body.res_startTime),
        res_endTime: new Date(body.res_endTime),
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

    return NextResponse.json(reservasi);
  } catch (error) {
    logServerError("[api/reservasi] Failed to create reservation", error, getRequestLogMeta(request));
    return NextResponse.json({ error: "Gagal menyimpan reservasi" }, { status: 500 });
  }
}
