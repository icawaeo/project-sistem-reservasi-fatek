import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const parseDateTime = (date: string, time: string) => {
  const parsed = new Date(`${date}T${time}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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
      const requestStart = parseDateTime(startDate as string, startTime as string);
      const requestEnd = parseDateTime(endDate as string, endTime as string);

      if (!requestStart || !requestEnd) {
        return NextResponse.json({ error: "Format tanggal/waktu tidak valid" }, { status: 400 });
      }

      if (requestEnd <= requestStart) {
        return NextResponse.json({ error: "Rentang waktu tidak valid" }, { status: 400 });
      }

      const rooms = await prisma.room.findMany({
        where: {
          room_isActive: true,
          ...(building ? { room_building: building } : {}),
          reservations: {
            none: {
              res_startTime: { lt: requestEnd },
              res_endTime: { gt: requestStart },
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

    const result = rooms.map(({ reservations, ...room }) => ({
      ...room,
      isCurrentlyOccupied: reservations.length > 0,
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data ruangan" }, { status: 500 });
  }
}