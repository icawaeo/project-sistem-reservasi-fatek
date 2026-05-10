import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { isSuperadminUser } from "@/lib/admin-access";
import { getRequestLogMeta, logServerError, logServerWarn } from "@/lib/server-logger";
import { saveBase64Image } from "@/lib/image-upload";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

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

const parseStatus = (value: unknown) => (value === "maintenance" ? "maintenance" : "aktif");

const mapBuilding = (building: {
  building_id: string;
  building_name: string;
  operational_days: string[];
  open_time: string;
  close_time: string;
  building_imageUrl: string | null;
  building_isActive: boolean;
}) => ({
  id: building.building_id,
  name: building.building_name,
  operationalDays: building.operational_days,
  openTime: building.open_time,
  closeTime: building.close_time,
  imageUrl: building.building_imageUrl,
  status: building.building_isActive ? "aktif" : "maintenance",
});

const authorize = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user || !isSuperadminUser(session.user)) {
    return null;
  }

  return session;
};

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await authorize();

    if (!session) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "ID gedung tidak valid" }, { status: 400 });
    }

    const existing = await prisma.building.findUnique({
      where: {
        building_id: id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Gedung tidak ditemukan" }, { status: 404 });
    }

    const body = await request.json();

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const operationalDays = normalizeDays(body?.operationalDays);
    const openTime = normalizeTime(body?.openTime);
    const closeTime = normalizeTime(body?.closeTime);
    const rawImageUrl = typeof body?.imageUrl === "string" ? body.imageUrl : null;
    const imageUrl = await saveBase64Image(rawImageUrl, "building");
    const status = parseStatus(body?.status);

    if (!name || operationalDays.length === 0 || !openTime || !closeTime || openTime >= closeTime) {
      return NextResponse.json({ error: "Data gedung belum valid" }, { status: 400 });
    }

    const [building] = await prisma.$transaction([
      prisma.building.update({
        where: {
          building_id: id,
        },
        data: {
          building_name: name,
          operational_days: operationalDays,
          open_time: openTime,
          close_time: closeTime,
          building_imageUrl: imageUrl,
          building_isActive: status === "aktif",
        },
      }),
      prisma.room.updateMany({
        where: {
          room_building: existing.building_name,
        },
        data: {
          room_building: name,
        },
      }),
    ]);

    return NextResponse.json(mapBuilding(building));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        logServerWarn("[api/admin/buildings/:id] Building not found during update", {
          ...getRequestLogMeta(request),
          code: error.code,
        });
        return NextResponse.json({ error: "Gedung tidak ditemukan" }, { status: 404 });
      }

      if (error.code === "P2002") {
        logServerWarn("[api/admin/buildings/:id] Duplicate building name during update", {
          ...getRequestLogMeta(request),
          code: error.code,
        });
        return NextResponse.json({ error: "Nama gedung sudah terdaftar" }, { status: 409 });
      }
    }

    logServerError("[api/admin/buildings/:id] Failed to update building", error, getRequestLogMeta(request));
    return NextResponse.json({ error: "Gagal memperbarui gedung" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await authorize();

    if (!session) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "ID gedung tidak valid" }, { status: 400 });
    }

    const building = await prisma.building.findUnique({
      where: {
        building_id: id,
      },
      select: {
        building_id: true,
        building_name: true,
      },
    });

    if (!building) {
      return NextResponse.json({ error: "Gedung tidak ditemukan" }, { status: 404 });
    }

    const usedRooms = await prisma.room.count({
      where: {
        room_building: building.building_name,
      },
    });

    if (usedRooms > 0) {
      return NextResponse.json(
        { error: "Gedung tidak dapat dihapus karena masih digunakan oleh data ruangan" },
        { status: 409 }
      );
    }

    await prisma.building.delete({
      where: {
        building_id: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logServerError("[api/admin/buildings/:id] Failed to delete building", error, getRequestLogMeta(request));
    return NextResponse.json({ error: "Gagal menghapus gedung" }, { status: 500 });
  }
}
