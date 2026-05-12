import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getRequestLogMeta, logServerError } from "@/lib/server-logger";

const parseDateTime = (date: string, time: string) => {
  const parsed = new Date(`${date}T${time}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

type RoomWithReservations = {
	reservations: Array<{ res_id: string }>;
	[key: string]: unknown;
};

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
          ...(building ? { room_building: building } : {}),
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

      return NextResponse.json(rooms);
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

    const result = rooms.map(({ reservations, ...room }: RoomWithReservations) => ({
      ...room,
      isCurrentlyOccupied: reservations.length > 0,
    }));

    return NextResponse.json(result);
  } catch (error) {
    logServerError("[api/rooms] Failed to fetch rooms", error, getRequestLogMeta(request));
    return NextResponse.json({ error: "Gagal mengambil data ruangan" }, { status: 500 });
  }
}