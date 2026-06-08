import { prisma } from "@/lib/prisma";
import { getDailyReservationSlots, rangesConflictByDailySlots } from "@/lib/reservation-slots";
import { getWitaDateTimeParts } from "@/lib/timezone";

export type RoomScheduleConflict = {
  id: string;
  title: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  roomName: string;
};

export type RoomScheduleConflictResult =
  | { ok: true; conflicts: [] }
  | { ok: false; conflicts: RoomScheduleConflict[]; error: string };

type ScheduleBlockConflictCandidate = {
  id: string;
  title: string;
  type: string;
  scheduleDate: Date;
  startTime: string;
  endTime: string;
  room: {
    room_name: string;
  };
};

type ReservationConflictCandidate = {
  res_startTime: Date;
  res_endTime: Date;
};

export const SCHEDULE_TYPE_LABELS: Record<string, string> = {
  KULIAH: "jadwal kuliah",
  PRAKTIKUM: "jadwal praktikum",
  UJIAN: "jadwal ujian",
  RAPAT_RUTIN: "rapat rutin",
  BLOKIR_MANUAL: "blokir manual ruangan",
};

export const ACTIVE_RESERVATION_STATUSES = [
  "PENDING",
  "PENDING_KABAG",
  "PENDING_DEKAN",
  "PENDING_WD2",
  "PENDING_WAKIL_DEKAN_2",
  "PENDING_KAJUR",
  "PENDING_KEPALA_LAB",
  "APPROVED",
  "DISETUJUI",
];

const toDateOnly = (dateYmd: string) => new Date(`${dateYmd}T00:00:00.000Z`);

const formatScheduleDate = (date: Date) => date.toISOString().slice(0, 10);

const buildScheduleConflictError = (conflict: RoomScheduleConflict) => {
  const typeLabel = SCHEDULE_TYPE_LABELS[conflict.type] ?? "jadwal ruangan";
  return `Ruangan ${conflict.roomName} tidak tersedia pada tanggal dan waktu tersebut karena sudah digunakan untuk ${typeLabel}.`;
};

export async function findRoomScheduleConflicts(params: {
  roomId: string;
  startTime: Date;
  endTime: Date;
  excludeScheduleId?: string;
}): Promise<RoomScheduleConflict[]> {
  const requestedSlots = getDailyReservationSlots({
    startTime: params.startTime,
    endTime: params.endTime,
  });

  if (requestedSlots.length === 0) {
    return [];
  }

  const dates = requestedSlots.map((slot) => slot.date);
  const blocks: ScheduleBlockConflictCandidate[] = await prisma.roomScheduleBlock.findMany({
    where: {
      roomId: params.roomId,
      isActive: true,
      ...(params.excludeScheduleId ? { id: { not: params.excludeScheduleId } } : {}),
      scheduleDate: {
        in: dates.map(toDateOnly),
      },
    },
    include: {
      room: {
        select: {
          room_name: true,
        },
      },
    },
    orderBy: [{ scheduleDate: "asc" }, { startTime: "asc" }],
  });

  return blocks
    .filter((block) =>
      requestedSlots.some((slot) => {
        const blockDate = formatScheduleDate(block.scheduleDate);
        if (blockDate !== slot.date) return false;

        const requestedStart = getWitaDateTimeParts(slot.start).time;
        const requestedEnd = getWitaDateTimeParts(slot.end).time;
        return requestedStart < block.endTime && requestedEnd > block.startTime;
      }),
    )
    .map((block) => ({
      id: block.id,
      title: block.title,
      type: block.type,
      date: formatScheduleDate(block.scheduleDate),
      startTime: block.startTime,
      endTime: block.endTime,
      roomName: block.room.room_name,
    }));
}

export async function validateRoomScheduleAvailability(params: {
  roomId: string;
  startTime: Date;
  endTime: Date;
}): Promise<RoomScheduleConflictResult> {
  const conflicts = await findRoomScheduleConflicts(params);
  if (conflicts.length === 0) {
    return { ok: true, conflicts: [] };
  }

  return {
    ok: false,
    conflicts,
    error: buildScheduleConflictError(conflicts[0]),
  };
}

export async function validateScheduleBlockDoesNotConflict(params: {
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  excludeScheduleId?: string;
}) {
  const requestedStart = new Date(`${params.date}T${params.startTime}:00+08:00`);
  const requestedEnd = new Date(`${params.date}T${params.endTime}:00+08:00`);

  if (Number.isNaN(requestedStart.getTime()) || Number.isNaN(requestedEnd.getTime()) || requestedEnd <= requestedStart) {
    return { ok: false as const, error: "Tanggal atau waktu jadwal tidak valid." };
  }

  const scheduleConflicts = await findRoomScheduleConflicts({
    roomId: params.roomId,
    startTime: requestedStart,
    endTime: requestedEnd,
    excludeScheduleId: params.excludeScheduleId,
  });

  if (scheduleConflicts.length > 0) {
    const conflict = scheduleConflicts[0];
    return {
      ok: false as const,
      error: `Jadwal bentrok dengan ${conflict.title} pada ${conflict.date} ${conflict.startTime}-${conflict.endTime}.`,
    };
  }

  const existingReservations: ReservationConflictCandidate[] = await prisma.reservation.findMany({
    where: {
      room_id: params.roomId,
      res_status: { in: ACTIVE_RESERVATION_STATUSES },
      res_startTime: { lt: requestedEnd },
      res_endTime: { gt: requestedStart },
    },
    select: {
      res_startTime: true,
      res_endTime: true,
    },
  });

  const reservationConflict = existingReservations.find((reservation) =>
    rangesConflictByDailySlots(
      { startTime: requestedStart, endTime: requestedEnd },
      { startTime: reservation.res_startTime, endTime: reservation.res_endTime },
      0,
    ),
  );

  if (reservationConflict) {
    return { ok: false as const, error: "Jadwal bentrok dengan reservasi yang sudah tercatat." };
  }

  return { ok: true as const };
}
