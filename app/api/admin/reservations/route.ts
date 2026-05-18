import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { isSuperadminUser } from "@/lib/admin-access";
import type { MonitoringReservation } from "@/app/components/administrator/monitoring-pengajuan/monitoring-types";
import { getRequestLogMeta, logServerError } from "@/lib/server-logger";

const parseDateTime = (date: string, time: string) => {
  const parsed = new Date(`${date}T${time}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const splitReservationPurpose = (value: string | null) => {
  if (!value) {
    return { activityName: "-", purpose: "-" };
  }

  const [activityName, ...purposeParts] = value.split(" - ");
  const purpose = purposeParts.join(" - ").trim();

  return {
    activityName: activityName.trim() || "-",
    purpose: purpose || "-",
  };
};

const mapReservation = (item: {
  res_id: string;
  res_date: Date;
  res_startTime: Date;
  res_endTime: Date;
  res_purpose: string;
  res_status: string;
  res_documentUrl: string | null;
  res_decisionDocumentUrl: string | null;
  user: {
    name: string;
    userType: "USER" | "STAFF";
    identifier: string | null;
    email: string;
  };
  room: {
    room_name: string;
    room_building: string;
    room_locDetail: string;
  };
}): MonitoringReservation => ({
  ...splitReservationPurpose(item.res_purpose),
  id: item.res_id,
  createdAt: item.res_date.toISOString(),
  startTime: item.res_startTime.toISOString(),
  endTime: item.res_endTime.toISOString(),
  status: item.res_status,
  documentUrl: item.res_documentUrl,
  decisionDocumentUrl: item.res_decisionDocumentUrl,
  user: {
    name: item.user.name,
    userType: item.user.userType,
    identifier: item.user.identifier,
    email: item.user.email,
  },
  room: {
    name: item.room.room_name,
    building: item.room.room_building,
    location: item.room.room_locDetail,
  },
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !isSuperadminUser(session.user)) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await request.json();

    const roomId = typeof body?.room_id === "string" ? body.room_id : "";
    const startDate = typeof body?.startDate === "string" ? body.startDate : "";
    const endDate = typeof body?.endDate === "string" ? body.endDate : startDate;
    const startTime = typeof body?.startTime === "string" ? body.startTime : "";
    const endTime = typeof body?.endTime === "string" ? body.endTime : "";
    const borrowerName = typeof body?.borrowerName === "string" ? body.borrowerName.trim() : "";
    const borrowerEmail = typeof body?.borrowerEmail === "string" ? body.borrowerEmail.trim().toLowerCase() : "";
    const activityName = typeof body?.activityName === "string" ? body.activityName.trim() : "";
    const purposeDetail = typeof body?.purposeDetail === "string" ? body.purposeDetail.trim() : "";

    if (!roomId || !startDate || !startTime || !endTime || !borrowerName || !borrowerEmail || !activityName) {
      return NextResponse.json({ error: "Data pengajuan belum lengkap" }, { status: 400 });
    }

    const startDateTime = parseDateTime(startDate, startTime);
    const endDateTime = parseDateTime(endDate, endTime);

    if (!startDateTime || !endDateTime || endDateTime <= startDateTime) {
      return NextResponse.json({ error: "Rentang tanggal/waktu tidak valid" }, { status: 400 });
    }

    const room = await prisma.room.findUnique({
      where: { room_id: roomId },
      select: { room_id: true, room_isActive: true },
    });

    if (!room || !room.room_isActive) {
      return NextResponse.json({ error: "Ruangan tidak ditemukan atau tidak aktif" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: borrowerEmail },
      select: {
        user_id: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Email peminjam belum terdaftar. Tambahkan user terlebih dahulu di menu Kelola User." },
        { status: 404 }
      );
    }

    const overlappingReservation = await prisma.reservation.findFirst({
      where: {
        room_id: roomId,
        res_startTime: { lt: endDateTime },
        res_endTime: { gt: startDateTime },
      },
      select: { res_id: true },
    });

    if (overlappingReservation) {
      return NextResponse.json(
        { error: "Jadwal bentrok. Ruangan sudah terpakai pada rentang waktu tersebut." },
        { status: 409 }
      );
    }

    const reservationPurpose = purposeDetail ? `${activityName} - ${purposeDetail}` : activityName;

    const createdReservation = await prisma.reservation.create({
      data: {
        room_id: roomId,
        user_id: user.user_id,
        res_startTime: startDateTime,
        res_endTime: endDateTime,
        res_purpose: reservationPurpose,
        res_status: "PENDING",
        res_documentUrl: null,
        res_decisionDocumentUrl: null,
      },
      include: {
        user: {
          select: {
            name: true,
            userType: true,
            identifier: true,
            email: true,
          },
        },
        room: {
          select: {
            room_name: true,
            room_building: true,
            room_locDetail: true,
          },
        },
      },
    });

    return NextResponse.json({ data: mapReservation(createdReservation) }, { status: 201 });
  } catch (error) {
    logServerError("[api/admin/reservations] Failed to create reservation", error, getRequestLogMeta(request));
    return NextResponse.json({ error: "Gagal menambahkan pengajuan" }, { status: 500 });
  }
}
