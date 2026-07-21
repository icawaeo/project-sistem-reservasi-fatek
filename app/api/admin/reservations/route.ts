import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { isSuperadminUser } from "@/lib/admin-access";
import type { MonitoringReservation } from "@/app/components/administrator/monitoring-pengajuan/monitoring-types";
import { getRequestLogMeta, logServerError } from "@/lib/server-logger";
import {
  getDailyReservationSlots,
  rangesConflictByDailySlots,
  RESERVATION_BUFFER_MS,
} from "@/lib/reservation-slots";
import { validateRoomScheduleAvailability } from "@/lib/room-schedule-conflicts";
import { sendNotification } from "@/lib/notificationService";

const parseDateTime = (date: string, time: string) => {
  const parsed = new Date(`${date}T${time}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const INACTIVE_STATUSES = [
  "REJECTED",
  "REJECTED_KABAG",
  "REJECTED_DEKAN",
  "REJECTED_WD2",
  "REJECTED_KAJUR",
  "REJECTED_KEPALA_LAB",
  "REJECTED_PRIORITY",
  "COMPLETED",
  "CANCELLED",
];

type IncomingActivityType = "AKADEMIK" | "NON_AKADEMIK";

type ReservationConflictCandidate = {
  res_id: string;
  res_startTime: Date;
  res_endTime: Date;
  res_activityType: string;
  user_id: string | null;
  room: { room_name: string };
};

const normalizeActivityType = (value: unknown): IncomingActivityType | null => {
  if (typeof value !== "string") return null;
  const normalized = value.toUpperCase();
  if (normalized === "AKADEMIK" || normalized === "NON_AKADEMIK") {
    return normalized as IncomingActivityType;
  }
  return null;
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
  } | null;
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
    name: item.user?.name ?? "User terhapus",
    userType: item.user?.userType ?? "USER",
    identifier: item.user?.identifier ?? null,
    email: item.user?.email ?? "-",
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
    const incomingActivityType = normalizeActivityType(body?.res_activityType);
    const resolvedActivityType: IncomingActivityType = incomingActivityType ?? "NON_AKADEMIK";

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

    const requestedSlots = getDailyReservationSlots({
      startTime: startDateTime,
      endTime: endDateTime,
    });

    if (requestedSlots.length === 0) {
      return NextResponse.json({ error: "Rentang tanggal/waktu tidak valid" }, { status: 400 });
    }

    const firstRequestedSlot = requestedSlots[0];
    const lastRequestedSlot = requestedSlots[requestedSlots.length - 1];

    const possibleConflicts: ReservationConflictCandidate[] = await prisma.reservation.findMany({
      where: {
        room_id: roomId,
        res_status: { notIn: INACTIVE_STATUSES },
        res_startTime: { lt: new Date(lastRequestedSlot.end.getTime() + RESERVATION_BUFFER_MS) },
        res_endTime: { gt: new Date(firstRequestedSlot.start.getTime() - RESERVATION_BUFFER_MS) },
      },
      select: {
        res_id: true,
        res_startTime: true,
        res_endTime: true,
        res_activityType: true,
        user_id: true,
        room: { select: { room_name: true } },
      },
    });

    const conflictingReservations = possibleConflicts.filter((reservation) =>
      rangesConflictByDailySlots(
        { startTime: startDateTime, endTime: endDateTime },
        { startTime: reservation.res_startTime, endTime: reservation.res_endTime },
      ),
    );

    if (conflictingReservations.length > 0) {
      const canDisplace =
        resolvedActivityType === "AKADEMIK" &&
        conflictingReservations.every((r) => r.res_activityType === "NON_AKADEMIK");

      if (!canDisplace) {
        return NextResponse.json(
          { error: "Jadwal bentrok atau masih berada dalam jeda 2 jam pemakaian ruangan." },
          { status: 409 }
        );
      }

      // Reject reservasi non-akademik yang bentrok
      for (const conflicting of conflictingReservations) {
        await prisma.reservation.update({
          where: { res_id: conflicting.res_id },
          data: {
            res_status: "REJECTED_PRIORITY",
            res_processedBy: "SYSTEM_PRIORITY",
            res_processedAt: new Date(),
            res_decisionAt: new Date(),
          },
        });

        if (conflicting.user_id) {
          try {
            await sendNotification(
              conflicting.user_id,
              "RESERVATION_PRIORITY_REPLACED",
              "Reservasi Dibatalkan \u2014 Prioritas Akademik",
              `Reservasi Anda untuk ${conflicting.room.room_name} telah dibatalkan karena ada kegiatan akademik yang diprioritaskan pada jadwal yang sama.`,
              { reservationId: conflicting.res_id },
            );
          } catch (error) {
            console.error("Error sending priority replacement notification:", error);
          }
        }
      }
    }

    const scheduleAvailability = await validateRoomScheduleAvailability({
      roomId,
      startTime: startDateTime,
      endTime: endDateTime,
    });

    if (!scheduleAvailability.ok) {
      return NextResponse.json({ error: scheduleAvailability.error }, { status: 409 });
    }

    const reservationPurpose = purposeDetail ? `${activityName} - ${purposeDetail}` : activityName;

    const createdReservation = await prisma.reservation.create({
      data: {
        room_id: roomId,
        user_id: user.user_id,
        res_startTime: startDateTime,
        res_endTime: endDateTime,
        res_purpose: reservationPurpose,
        res_activityType: resolvedActivityType,
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
