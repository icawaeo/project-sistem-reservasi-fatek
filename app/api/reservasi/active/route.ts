import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getRequestLogMeta, logServerError } from "@/lib/server-logger";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ hasActive: false });
    }

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
      select: { res_id: true },
    });

    return NextResponse.json({ hasActive: !!activeReservation });
  } catch (error) {
    logServerError("[api/reservasi/active] Failed to check active reservation", error, getRequestLogMeta(request));
    return NextResponse.json({ error: "Gagal mengecek status reservasi" }, { status: 500 });
  }
}
