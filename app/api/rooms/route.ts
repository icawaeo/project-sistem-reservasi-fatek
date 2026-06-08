import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getRequestLogMeta, logServerError } from "@/lib/server-logger";
import {
  validateBuildingOperationalWindow,
  type BuildingOperationalSchedule,
} from "@/lib/building-operational-policy";
import { resolveRoomDisplayImage } from "@/app/utils/building";
import { parseWitaDateTime } from "@/lib/timezone";
import { validateNotHolidayRange } from "@/lib/holiday-calendar";
import {
  getDailyReservationSlots,
  isDateInsideDailyReservationSlot,
  rangesConflictByDailySlots,
  RESERVATION_BUFFER_MS,
} from "@/lib/reservation-slots";
import { validateRoomScheduleAvailability } from "@/lib/room-schedule-conflicts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const parseDateTime = (date: string, time: string) => {
  return parseWitaDateTime(date, time);
};

type CandidateBuilding = BuildingOperationalSchedule & {
  building_name: string;
};

type PublicRoom = {
  room_building: string;
  room_imageUrl: string | null;
  [key: string]: unknown;
};

type RoomWithReservations = PublicRoom & {
  reservations: Array<{
    res_id: string;
    res_startTime: Date;
    res_endTime: Date;
  }>;
};

const withResolvedRoomImage = <T extends PublicRoom>(room: T) => ({
  ...room,
  room_imageUrl: resolveRoomDisplayImage(room.room_imageUrl, room.room_building),
});

const INACTIVE_RESERVATION_STATUSES = [
  "REJECTED",
  "REJECTED_KABAG",
  "REJECTED_DEKAN",
  "REJECTED_WD2",
  "REJECTED_KAJUR",
  "REJECTED_KEPALA_LAB",
  "COMPLETED",
  "CANCELLED",
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate") || startDate;
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");
    const building = searchParams.get("building");

    const hasScheduleParams = !!(startDate && endDate && startTime && endTime);

    if (hasScheduleParams) {
      const requestStart = parseDateTime(startDate as string, startTime as string);
      const requestEnd = parseDateTime(endDate as string, endTime as string);

      if (!requestStart || !requestEnd) {
        return NextResponse.json({ error: "Format tanggal/waktu tidak valid" }, { status: 400 });
      }

      if (requestEnd <= requestStart) {
        return NextResponse.json(
          { error: "Jam selesai tidak boleh lebih awal dari jam mulai." },
          { status: 400 },
        );
      }

      const holidayCheck = await validateNotHolidayRange(startDate as string, endDate as string);
      if (!holidayCheck.ok) {
        return NextResponse.json({ error: holidayCheck.error, holidays: holidayCheck.holidays }, { status: 400 });
      }

      const candidateBuildings = await prisma.building.findMany({
        where: {
          building_isActive: true,
          ...(building ? { building_name: building } : {}),
        },
        select: {
          building_name: true,
          operational_days: true,
          open_time: true,
          close_time: true,
        },
      });

      if (building && candidateBuildings.length === 0) {
        return NextResponse.json({ error: "Gedung tidak ditemukan atau tidak aktif" }, { status: 404 });
      }

      const eligibleBuildings = (candidateBuildings as CandidateBuilding[]).filter((candidate) =>
        validateBuildingOperationalWindow({
          startDate: startDate as string,
          endDate: endDate as string,
          startTime: startTime as string,
          endTime: endTime as string,
          schedule: candidate,
        }).ok,
      );

      if (building && eligibleBuildings.length === 0) {
        const validation = validateBuildingOperationalWindow({
          startDate: startDate as string,
          endDate: endDate as string,
          startTime: startTime as string,
          endTime: endTime as string,
          schedule: candidateBuildings[0] as BuildingOperationalSchedule,
        });

        return NextResponse.json(
          { error: validation.ok ? "Jadwal tidak sesuai jam operasional gedung." : validation.error },
          { status: 400 },
        );
      }

      const eligibleBuildingNames = eligibleBuildings.map((candidate) => candidate.building_name);
      if (eligibleBuildingNames.length === 0) {
        return NextResponse.json([]);
      }

      const requestedRange = {
        startTime: requestStart,
        endTime: requestEnd,
      };
      const requestedSlots = getDailyReservationSlots(requestedRange);

      if (requestedSlots.length === 0) {
        return NextResponse.json({ error: "Rentang tanggal/waktu tidak valid" }, { status: 400 });
      }

      const firstRequestedSlot = requestedSlots[0];
      const lastRequestedSlot = requestedSlots[requestedSlots.length - 1];

      const rooms = await prisma.room.findMany({
        where: {
          room_isActive: true,
          room_building: { in: eligibleBuildingNames },
        },
        include: {
          reservations: {
            where: {
              res_status: { notIn: INACTIVE_RESERVATION_STATUSES },
              res_startTime: { lt: new Date(lastRequestedSlot.end.getTime() + RESERVATION_BUFFER_MS) },
              res_endTime: { gt: new Date(firstRequestedSlot.start.getTime() - RESERVATION_BUFFER_MS) },
            },
            select: {
              res_id: true,
              res_startTime: true,
              res_endTime: true,
            },
          },
        },
        orderBy: [{ room_building: "asc" }, { room_name: "asc" }],
      });

      const roomsWithoutReservationConflict = (rooms as RoomWithReservations[])
        .filter((room) =>
          room.reservations.every(
            (reservation) =>
              !rangesConflictByDailySlots(requestedRange, {
                startTime: reservation.res_startTime,
                endTime: reservation.res_endTime,
              }),
          ),
        )
        .map(({ reservations: _reservations, ...room }) => room);

      const availabilityChecks = await Promise.all(
        roomsWithoutReservationConflict.map(async (room) => {
          const scheduleCheck = await validateRoomScheduleAvailability({
            roomId: room.room_id as string,
            startTime: requestStart,
            endTime: requestEnd,
          });

          return {
            room,
            isAvailable: scheduleCheck.ok,
          };
        }),
      );

      const availableRooms = availabilityChecks
        .filter((item) => item.isAvailable)
        .map((item) => withResolvedRoomImage(item.room));

      return NextResponse.json(availableRooms, {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(now);
    dayEnd.setHours(23, 59, 59, 999);

    const rooms = await prisma.room.findMany({
      where: {
        room_isActive: true,
        ...(building ? { room_building: building } : {}),
      },
      include: {
        reservations: {
          where: {
            res_status: { notIn: INACTIVE_RESERVATION_STATUSES },
            res_startTime: { lte: dayEnd },
            res_endTime: { gte: dayStart },
          },
          select: {
            res_id: true,
            res_startTime: true,
            res_endTime: true,
          },
        },
      },
      orderBy: [{ room_building: "asc" }, { room_name: "asc" }],
    });

    const result = (rooms as RoomWithReservations[]).map(({ reservations, ...room }) =>
      withResolvedRoomImage({
        ...room,
        isCurrentlyOccupied: reservations.some((reservation) =>
          isDateInsideDailyReservationSlot(
            {
              startTime: reservation.res_startTime,
              endTime: reservation.res_endTime,
            },
            now,
          ),
        ),
      }),
    );

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    logServerError("[api/rooms] Failed to fetch rooms", error, getRequestLogMeta(request));
    return NextResponse.json({ error: "Gagal mengambil data ruangan" }, { status: 500 });
  }
}
