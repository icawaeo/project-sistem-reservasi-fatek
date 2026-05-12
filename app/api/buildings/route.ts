import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getRequestLogMeta, logServerError } from "@/lib/server-logger";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json({ error: "Parameter nama gedung dibutuhkan" }, { status: 400 });
    }

    const building = await prisma.building.findUnique({
      where: {
        building_name: name,
      },
    });

    if (!building) {
      return NextResponse.json({ error: "Gedung tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(building);
  } catch (error) {
    logServerError("[api/buildings] Failed to fetch building", error, getRequestLogMeta(request));
    return NextResponse.json({ error: "Gagal mengambil data gedung" }, { status: 500 });
  }
}
