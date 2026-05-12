import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { isSuperadminUser } from "@/lib/admin-access";
import { isPrismaKnownRequestError } from "@/lib/prisma-errors";
import { getRequestLogMeta, logServerError, logServerWarn } from "@/lib/server-logger";
import { saveBase64Image } from "@/lib/image-upload";

const parseFacilities = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
};

const parseStatus = (value: unknown) => (value === "maintenance" ? "maintenance" : "aktif");

import { isLabBuilding } from "@/app/utils/building";

const LAB_PROGRAM_VALUES = [
  "IT",
  "ELEKTRO",
  "ARSITEKTUR",
  "PWK",
  "SIPIL",
  "LINGKUNGAN",
  "MESIN",
] as const;

type LabProgramValue = (typeof LAB_PROGRAM_VALUES)[number];

type LabDepartmentValue = "ELEKTRO" | "ARSITEKTUR" | "SIPIL" | "MESIN";

const PROGRAM_TO_DEPARTMENT: Record<LabProgramValue, LabDepartmentValue> = {
  ELEKTRO: "ELEKTRO",
  IT: "ELEKTRO",
  ARSITEKTUR: "ARSITEKTUR",
  PWK: "ARSITEKTUR",
  SIPIL: "SIPIL",
  LINGKUNGAN: "SIPIL",
  MESIN: "MESIN",
};

const parseLabProgram = (value: unknown): LabProgramValue | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim() as LabProgramValue;
  return LAB_PROGRAM_VALUES.includes(trimmed) ? trimmed : null;
};

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
  labProgram: LabProgramValue | null;
  labDepartment: LabDepartmentValue | null;
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
    labProgram: room.labProgram ?? null,
    labDepartment: room.labDepartment ?? null,
  };
};

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

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
      return NextResponse.json({ error: "ID ruangan tidak valid" }, { status: 400 });
    }

    const body = await request.json();

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const building = typeof body?.building === "string" ? body.building.trim() : "";
    const floor = typeof body?.floor === "string" ? normalizeFloor(body.floor) : "";
    const capacity = Number(body?.capacity);
    const facilities = parseFacilities(body?.facilities);
    const rawImageUrl = typeof body?.imageUrl === "string" ? body.imageUrl : null;
    const imageUrl = await saveBase64Image(rawImageUrl, "room");
    const status = parseStatus(body?.status);

    const isLabBuildingFlag = isLabBuilding(building);
    const labProgram = isLabBuildingFlag ? parseLabProgram(body?.labProgram) : null;
    const labDepartment = labProgram ? PROGRAM_TO_DEPARTMENT[labProgram] : null;

    if (isLabBuildingFlag && !labProgram) {
      return NextResponse.json({ error: "Program studi lab wajib dipilih" }, { status: 400 });
    }

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

    const room = await prisma.room.update({
      where: {
        room_id: id,
      },
      data: {
        room_name: name,
        room_building: building,
        room_capacity: Math.floor(capacity),
        room_locDetail: buildRoomLocDetail(floor, facilities),
        room_imageUrl: imageUrl,
        room_isActive: status === "aktif",
        labProgram,
        labDepartment,
      },
    });

    return NextResponse.json(mapRoom(room));
  } catch (error) {
    if (isPrismaKnownRequestError(error) && error.code === "P2025") {
      logServerWarn("[api/admin/rooms/:id] Room not found during update", {
        ...getRequestLogMeta(request),
        code: error.code,
      });
      return NextResponse.json({ error: "Ruangan tidak ditemukan" }, { status: 404 });
    }

    logServerError("[api/admin/rooms/:id] Failed to update room", error, getRequestLogMeta(request));
    return NextResponse.json({ error: "Gagal memperbarui ruangan" }, { status: 500 });
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
      return NextResponse.json({ error: "ID ruangan tidak valid" }, { status: 400 });
    }

    await prisma.room.delete({
      where: {
        room_id: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isPrismaKnownRequestError(error)) {
      if (error.code === "P2025") {
        logServerWarn("[api/admin/rooms/:id] Room not found during delete", {
          ...getRequestLogMeta(request),
          code: error.code,
        });
        return NextResponse.json({ error: "Ruangan tidak ditemukan" }, { status: 404 });
      }

      if (error.code === "P2003") {
        logServerWarn("[api/admin/rooms/:id] Room delete blocked by FK", {
          ...getRequestLogMeta(request),
          code: error.code,
        });
        return NextResponse.json(
          { error: "Ruangan tidak dapat dihapus karena sudah memiliki riwayat reservasi" },
          { status: 409 }
        );
      }
    }

    logServerError("[api/admin/rooms/:id] Failed to delete room", error, getRequestLogMeta(request));
    return NextResponse.json({ error: "Gagal menghapus ruangan" }, { status: 500 });
  }
}
