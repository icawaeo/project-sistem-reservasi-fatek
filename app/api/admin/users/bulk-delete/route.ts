import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { isSuperadminUser } from "@/lib/admin-access";
import { getRequestLogMeta, logServerError } from "@/lib/server-logger";

const authorize = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user || !isSuperadminUser(session.user)) {
    return null;
  }

  return session;
};

export async function POST(request: Request) {
  try {
    const session = await authorize();

    if (!session) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await request.json();
    const ids = Array.isArray(body?.ids)
      ? body.ids.filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0)
      : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: "Tidak ada data user yang dipilih" }, { status: 400 });
    }

    const safeIds = ids.filter((id: string) => id !== session.user.id);

    if (safeIds.length === 0) {
      return NextResponse.json({ error: "Akun yang sedang dipakai tidak bisa dihapus" }, { status: 400 });
    }

    const usersWithReservation = await prisma.reservation.findMany({
      where: {
        user_id: {
          in: safeIds,
        },
      },
      distinct: ["user_id"],
      select: {
        user_id: true,
      },
    });

    const blockedIds = new Set(usersWithReservation.map((item) => item.user_id));
    const deletableIds = safeIds.filter((id: string) => !blockedIds.has(id));

    if (deletableIds.length === 0) {
      return NextResponse.json(
        { error: "Seluruh user terpilih memiliki riwayat reservasi dan tidak dapat dihapus" },
        { status: 409 }
      );
    }

    await prisma.user.deleteMany({
      where: {
        user_id: {
          in: deletableIds,
        },
      },
    });

    const skippedCount = safeIds.length - deletableIds.length;

    return NextResponse.json({
      deletedIds: deletableIds,
      skippedCount,
    });
  } catch (error) {
    logServerError("[api/admin/users/bulk-delete] Failed to bulk delete users", error, getRequestLogMeta(request));
    return NextResponse.json({ error: "Gagal menghapus user terpilih" }, { status: 500 });
  }
}
