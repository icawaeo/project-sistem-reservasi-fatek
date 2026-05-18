import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getRequestLogMeta, logServerError } from "@/lib/server-logger";
import {
  validateBuildingOperationalWindow,
  type BuildingOperationalSchedule,
} from "@/lib/building-operational-policy";
import { resolveRoomDisplayImage } from "@/app/utils/building";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const parseDateTime = (date: string, time: string) => {
  const parsed = new Date(`${date}T${time}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

type RoomWithReservations = {
	reservations: Array<{ res_id: string }>;
	[key: string]: unknown;
};

type CandidateBuilding = BuildingOperationalSchedule & {
  building_name: string;
};

type PublicRoom = {
  room_building: string;
  room_imageUrl: string | null;
  [key: string]: unknown;
};

const withResolvedRoomImage = <T extends PublicRoom>(room: T) => ({
  ...room,
  room_imageUrl: resolveRoomDisplayImage(room.room_imageUrl, room.room_building),
});

// Status reservasi yang sudah tidak aktif (tidak memblokir slot ruangan)
const INACTIVE_RESERVATION_STATUSES = [
  "REJECTED", "REJECTED_KABAG", "REJECTED_DEKAN",
  "REJECTED_WD2", "REJECTED_KAJUR", "REJECTED_KEPALA_LAB",
  "COMPLETED", "CANCELLED",
];

// Buffer 2 jam setelah reservasi selesai sebelum ruangan bisa dipakai lagi
const BUFFER_MS = 2 * 60 * 60 * 1000;

/**
 * Generate array of date strings (YYYY-MM-DD) from startDate to endDate (inclusive).
 */
const getDateRange = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  const current = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  while (current <= end) {
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
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate") || startDate;
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");
    const building = searchParams.get("building");

    const hasScheduleParams = !!(startDate && endDate && startTime && endTime);

    if (hasScheduleParams) {
      // Validasi dasar
      const testStart = parseDateTime(startDate as string, startTime as string);
      const testEnd = parseDateTime(startDate as string, endTime as string);

      if (!testStart || !testEnd) {
        return NextResponse.json({ error: "Format tanggal/waktu tidak valid" }, { status: 400 });
      }

      if (testEnd <= testStart) {
        return NextResponse.json(
          { error: "Jam selesai tidak boleh lebih awal dari jam mulai." },
          { status: 400 },
        );
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
          schedule: candidate as BuildingOperationalSchedule,
        }).ok
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

      const eligibleBuildingNames = eligibleBuildings.map((candidate: CandidateBuilding) => candidate.building_name);

      if (eligibleBuildingNames.length === 0) {
        return NextResponse.json([]);
      }

      // Generate daftar tanggal (untuk multi-day, cek per hari)
      const dates = getDateRange(startDate as string, endDate as string);

      // Buat kondisi overlap per hari dengan buffer 2 jam setelah reservasi selesai.
      // Buffer: jika reservasi berakhir jam 12:00, ruangan baru tersedia jam 14:00.
      // Rumus: res_endTime + 2h > requestStart  →  res_endTime > requestStart - 2h
      const dayOverlapConditions = dates.map((date) => {
        const dayStart = parseDateTime(date, startTime as string)!;
        const dayEnd = parseDateTime(date, endTime as string)!;
        const bufferedStart = new Date(dayStart.getTime() - BUFFER_MS);
        return {
          res_startTime: { lt: dayEnd },
          res_endTime: { gt: bufferedStart },
        };
      });

      // Ruangan tersedia jika TIDAK ADA reservasi aktif yang overlap di hari manapun
      const rooms = await prisma.room.findMany({
        where: {
          room_isActive: true,
          room_building: { in: eligibleBuildingNames },
          reservations: {
            none: {
              res_status: { notIn: INACTIVE_RESERVATION_STATUSES },
              OR: dayOverlapConditions,
            },
          },
        },
        orderBy: [
          { room_building: "asc" },
          { room_name: "asc" },
        ],
      });

      return NextResponse.json(rooms.map(withResolvedRoomImage), {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    const now = new Date();
    const rooms = await prisma.room.findMany({
      where: {
        room_isActive: true,
        ...(building ? { room_building: building } : {}),
      },
      include: {
        reservations: {
          where: {
            // Hanya reservasi aktif yang dianggap "sedang digunakan"
            res_status: { notIn: INACTIVE_RESERVATION_STATUSES },
            res_startTime: { lte: now },
            res_endTime: { gte: now },
          },
          select: { res_id: true },
        },
      },
      orderBy: [
        { room_building: "asc" },
        { room_name: "asc" },
      ],
    });

    const result = rooms.map(({ reservations, ...room }: RoomWithReservations) =>
      withResolvedRoomImage({
        ...(room as PublicRoom),
        isCurrentlyOccupied: reservations.length > 0,
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
