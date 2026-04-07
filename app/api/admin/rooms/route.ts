import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { isSuperadminUser } from "@/lib/admin-access";

const parseFacilities = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
};

const parseStatus = (value: unknown) => (value === "maintenance" ? "maintenance" : "aktif");

const normalizeCommaSeparated = (value: unknown): string[] => {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeFloor = (value: string) => {
  const trimmed = value.trim();
  const matchedNumber = trimmed.match(/\d+/);

  if (matchedNumber) {
    return matchedNumber[0];
  }

  return trimmed.replace(/^(lantai|lt\.?)/i, "").trim();
};

const parseRoomDetails = (value: unknown): { floor: string; facilities: string[] } => {
  const parts = normalizeCommaSeparated(value);

  if (parts.length === 0) {
    return { floor: "", facilities: [] };
  }

  const firstPart = parts[0];
  const hasFloorPrefix = /^(lantai|lt\.?)/i.test(firstPart) || /^\d+$/.test(firstPart);

  if (hasFloorPrefix) {
    return {
      floor: normalizeFloor(firstPart),
      facilities: parts.slice(1),
    };
  }

  return {
    floor: "",
    facilities: parts,
  };
};

const buildRoomLocDetail = (floor: string, facilities: string[]) => {
  const cleanedFloor = typeof floor === "string" ? normalizeFloor(floor) : "";
  const cleanedFacilities = Array.isArray(facilities)
    ? facilities.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean)
    : [];

  return [cleanedFloor, ...cleanedFacilities].filter(Boolean).join(", ");
};

const mapRoom = (room: {
  room_id: string;
  room_name: string;
  room_building: string;
  room_capacity: number;
  room_locDetail: string;
  room_imageUrl: string | null;
  room_isActive: boolean;
}) => {
  const details = parseRoomDetails(room.room_locDetail);

  return {
    id: room.room_id,
    name: room.room_name,
    building: room.room_building,
    floor: details.floor,
    capacity: room.room_capacity,
    facilities: details.facilities,
    imageUrl: room.room_imageUrl,
    status: room.room_isActive ? "aktif" : "maintenance",
  };
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !isSuperadminUser(session.user)) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const [rooms, buildingsData] = await Promise.all([
      prisma.room.findMany({
        orderBy: [{ room_id: "desc" }],
      }),
      prisma.building.findMany({
        orderBy: {
          building_name: "asc",
        },
        select: {
          building_name: true,
        },
      }),
    ]);

    const buildings = buildingsData.map((item) => item.building_name);

    return NextResponse.json({
      rooms: rooms.map(mapRoom),
      buildings,
    });
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data ruangan" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !isSuperadminUser(session.user)) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await request.json();

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const building = typeof body?.building === "string" ? body.building.trim() : "";
    const floor = typeof body?.floor === "string" ? normalizeFloor(body.floor) : "";
    const capacity = Number(body?.capacity);
    const facilities = parseFacilities(body?.facilities);
    const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl : null;
    const status = parseStatus(body?.status);

    if (!name || !building || Number.isNaN(capacity) || capacity <= 0) {
      return NextResponse.json({ error: "Data ruangan belum valid" }, { status: 400 });
    }

    const buildingExists = await prisma.building.findUnique({
      where: {
        building_name: building,
      },
      select: {
        building_id: true,
      },
    });

    if (!buildingExists) {
      return NextResponse.json({ error: "Gedung belum terdaftar di master gedung" }, { status: 400 });
    }

    const room = await prisma.room.create({
      data: {
        room_name: name,
        room_building: building,
        room_capacity: Math.floor(capacity),
        room_locDetail: buildRoomLocDetail(floor, facilities),
        room_imageUrl: imageUrl,
        room_isActive: status === "aktif",
      },
    });

    return NextResponse.json(mapRoom(room), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal menambahkan ruangan" }, { status: 500 });
  }
}
