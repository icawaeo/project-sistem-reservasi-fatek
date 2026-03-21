import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

const allowedSortValues = new Set(["newest", "oldest"]);

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const sortQuery = searchParams.get("sort") || "newest";
    const sort = allowedSortValues.has(sortQuery) ? sortQuery : "newest";

    const reservations = await prisma.reservation.findMany({
      where: {
        user_id: session.user.id,
      },
      include: {
        room: true,
      },
      orderBy: {
        res_startTime: sort === "oldest" ? "asc" : "desc",
      },
    });

    return NextResponse.json({
      reservations,
      sort,
    });
  } catch {
    return NextResponse.json({ error: "Gagal mengambil riwayat reservasi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validasi sederhana
    if (!body.room_id || !body.res_startTime || !body.res_endTime || !body.res_purpose) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const reservasi = await prisma.reservation.create({
      data: {
        room_id: body.room_id,
        user_id: session.user.id,
        res_startTime: new Date(body.res_startTime),
        res_endTime: new Date(body.res_endTime),
        res_purpose: body.res_purpose,
        res_status: "PENDING",
        res_documentUrl: body.res_documentUrl || null,
      },
      include: {
        room: true,
        user: true,
      },
    });

    return NextResponse.json(reservasi);
  } catch (e) {
    return NextResponse.json({ error: "Gagal menyimpan reservasi" }, { status: 500 });
  }
}
