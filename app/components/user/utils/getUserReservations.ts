import "server-only";

import { prisma } from "@/lib/prisma";
import type { ReservationRecord, SortOrder } from "../riwayat/_types";

const allowedSortValues = new Set<SortOrder>(["newest", "oldest"]);

export const normalizeSortOrder = (value: unknown): SortOrder => {
  if (value === "oldest" || value === "newest") return value;
  if (typeof value === "string" && allowedSortValues.has(value as SortOrder)) {
    return value as SortOrder;
  }
  return "newest";
};

export async function getUserReservations(userId: string, sort: SortOrder): Promise<ReservationRecord[]> {
  const reservations = await prisma.reservation.findMany({
    where: {
      user_id: userId,
    },
    include: {
      room: {
        select: {
          room_name: true,
          room_building: true,
        },
      },
    },
    orderBy: {
      res_startTime: sort === "oldest" ? "asc" : "desc",
    },
  });

  return reservations.map((reservation) => ({
    res_id: reservation.res_id,
    res_startTime: reservation.res_startTime.toISOString(),
    res_endTime: reservation.res_endTime.toISOString(),
    res_status: String(reservation.res_status),
    res_purpose: reservation.res_purpose,
    res_documentUrl: reservation.res_documentUrl,
    room: {
      room_name: reservation.room.room_name,
      room_building: reservation.room.room_building,
    },
  }));
}
