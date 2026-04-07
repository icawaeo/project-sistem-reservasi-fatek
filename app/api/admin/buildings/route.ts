import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { isSuperadminUser } from "@/lib/admin-access";

const normalizeDays = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
};

const normalizeTime = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(trimmed) ? trimmed : "";
};

const mapBuilding = (building: {
  building_id: string;
  building_name: string;
  operational_days: string[];
  open_time: string;
  close_time: string;
}) => ({
  id: building.building_id,
  name: building.building_name,
  operationalDays: building.operational_days,
  openTime: building.open_time,
  closeTime: building.close_time,
});

const authorize = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user || !isSuperadminUser(session.user)) {
    return null;
  }

  return session;
};

export async function GET() {
  try {
    const session = await authorize();

    if (!session) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const buildings = await prisma.building.findMany({
      orderBy: {
        building_name: "asc",
      },
    });

    return NextResponse.json(buildings.map(mapBuilding));
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data gedung" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await authorize();

    if (!session) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await request.json();

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const operationalDays = normalizeDays(body?.operationalDays);
    const openTime = normalizeTime(body?.openTime);
    const closeTime = normalizeTime(body?.closeTime);

    if (!name || operationalDays.length === 0 || !openTime || !closeTime || openTime >= closeTime) {
      return NextResponse.json({ error: "Data gedung belum valid" }, { status: 400 });
    }

    const building = await prisma.building.create({
      data: {
        building_name: name,
        operational_days: operationalDays,
        open_time: openTime,
        close_time: closeTime,
      },
    });

    return NextResponse.json(mapBuilding(building), { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Nama gedung sudah terdaftar" }, { status: 409 });
    }

    return NextResponse.json({ error: "Gagal menambahkan gedung" }, { status: 500 });
  }
}
