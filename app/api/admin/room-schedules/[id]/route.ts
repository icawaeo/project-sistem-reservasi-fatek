import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { validateBuildingOperationalWindow } from "@/lib/building-operational-policy";
import { getRequestLogMeta, logServerError } from "@/lib/server-logger";
import {
  canEditExistingSchedule,
  getAccessibleScheduleRooms,
  getScheduleManagerUser,
  isValidDateYmd,
  isValidTime,
  parseLabProgram,
  parseScheduleBlockType,
  resolveScheduleScopes,
} from "@/lib/room-schedule-access";
import { validateScheduleBlockDoesNotConflict } from "@/lib/room-schedule-conflicts";
import { LAB_DEPARTMENT_LABELS, LAB_PROGRAM_LABELS } from "@/lib/room-scope";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const toDateOnly = (dateYmd: string) => new Date(`${dateYmd}T00:00:00.000Z`);
const formatDateYmd = (date: Date) => date.toISOString().slice(0, 10);

const mapSchedule = (schedule: {
  id: string;
  title: string;
  type: string;
  scheduleDate: Date;
  startTime: string;
  endTime: string;
  buildingName: string;
  departmentScope: string | null;
  programScope: string | null;
  source: string;
  googleEventId: string | null;
  isActive: boolean;
  room: {
    room_id: string;
    room_name: string;
    room_building: string;
  };
}) => ({
  id: schedule.id,
  title: schedule.title,
  type: schedule.type,
  date: formatDateYmd(schedule.scheduleDate),
  startTime: schedule.startTime,
  endTime: schedule.endTime,
  buildingName: schedule.buildingName,
  departmentScope: schedule.departmentScope,
  departmentLabel: schedule.departmentScope
    ? LAB_DEPARTMENT_LABELS[schedule.departmentScope as keyof typeof LAB_DEPARTMENT_LABELS]
    : null,
  programScope: schedule.programScope,
  programLabel: schedule.programScope
    ? LAB_PROGRAM_LABELS[schedule.programScope as keyof typeof LAB_PROGRAM_LABELS]
    : null,
  source: schedule.source,
  googleEventId: schedule.googleEventId,
  isActive: schedule.isActive,
  room: {
    id: schedule.room.room_id,
    name: schedule.room.room_name,
    building: schedule.room.room_building,
  },
});

async function loadEditableSchedule(id: string) {
  const user = await getScheduleManagerUser();
  if (!user) return { ok: false as const, response: NextResponse.json({ error: "Akses ditolak" }, { status: 403 }) };

  const schedule = await prisma.roomScheduleBlock.findUnique({
    where: { id },
    include: {
      room: {
        select: {
          room_id: true,
          room_name: true,
          room_building: true,
          room_locDetail: true,
          labProgram: true,
          labDepartment: true,
        },
      },
    },
  });

  if (!schedule || !schedule.isActive) {
    return { ok: false as const, response: NextResponse.json({ error: "Jadwal tidak ditemukan." }, { status: 404 }) };
  }

  if (
    !canEditExistingSchedule({
      user,
      room: schedule.room,
      departmentScope: schedule.departmentScope,
      programScope: schedule.programScope,
    })
  ) {
    return { ok: false as const, response: NextResponse.json({ error: "Anda tidak berwenang mengubah jadwal ini." }, { status: 403 }) };
  }

  return { ok: true as const, user, schedule };
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID jadwal tidak valid." }, { status: 400 });
    }

    const loaded = await loadEditableSchedule(id);
    if (!loaded.ok) return loaded.response;

    const body = await request.json().catch(() => null);
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const roomId = typeof body?.roomId === "string" ? body.roomId : "";
    const date = typeof body?.date === "string" ? body.date : "";
    const startTime = typeof body?.startTime === "string" ? body.startTime : "";
    const endTime = typeof body?.endTime === "string" ? body.endTime : "";
    const type = parseScheduleBlockType(body?.type);
    const requestedProgram = parseLabProgram(body?.programScope);

    if (!title || !roomId || !isValidDateYmd(date) || !isValidTime(startTime) || !isValidTime(endTime)) {
      return NextResponse.json({ error: "Data jadwal belum lengkap atau tidak valid." }, { status: 400 });
    }

    if (endTime <= startTime) {
      return NextResponse.json({ error: "Jam selesai harus lebih besar dari jam mulai." }, { status: 400 });
    }

    const accessibleRooms = await getAccessibleScheduleRooms(loaded.user);
    const room = accessibleRooms.find((item) => item.room_id === roomId);
    if (!room) {
      return NextResponse.json({ error: "Anda tidak berwenang mengelola jadwal ruangan ini." }, { status: 403 });
    }

    const scopes = resolveScheduleScopes({ user: loaded.user, room, requestedProgram });
    if (!scopes) {
      return NextResponse.json({ error: "Scope jadwal tidak sesuai dengan role Anda." }, { status: 403 });
    }

    const operationalCheck = validateBuildingOperationalWindow({
      startDate: date,
      endDate: date,
      startTime,
      endTime,
      schedule: {
        operational_days: room.operational_days,
        open_time: room.open_time,
        close_time: room.close_time,
      },
    });

    if (!operationalCheck.ok) {
      return NextResponse.json({ error: operationalCheck.error }, { status: 400 });
    }

    const conflictCheck = await validateScheduleBlockDoesNotConflict({
      roomId,
      date,
      startTime,
      endTime,
      excludeScheduleId: id,
    });

    if (!conflictCheck.ok) {
      return NextResponse.json({ error: conflictCheck.error }, { status: 409 });
    }

    const updated = await prisma.roomScheduleBlock.update({
      where: { id },
      data: {
        title,
        type,
        scheduleDate: toDateOnly(date),
        startTime,
        endTime,
        roomId,
        buildingName: room.room_building,
        departmentScope: scopes.departmentScope,
        programScope: scopes.programScope,
        updatedById: loaded.user.id,
      },
      include: {
        room: {
          select: {
            room_id: true,
            room_name: true,
            room_building: true,
          },
        },
      },
    });

    return NextResponse.json({ schedule: mapSchedule(updated) });
  } catch (error) {
    logServerError("[api/admin/room-schedules/:id] Failed to update schedule", error, getRequestLogMeta(request));
    return NextResponse.json({ error: "Gagal memperbarui jadwal ruangan" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID jadwal tidak valid." }, { status: 400 });
    }

    const loaded = await loadEditableSchedule(id);
    if (!loaded.ok) return loaded.response;

    await prisma.roomScheduleBlock.update({
      where: { id },
      data: {
        isActive: false,
        updatedById: loaded.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logServerError("[api/admin/room-schedules/:id] Failed to delete schedule", error, getRequestLogMeta(request));
    return NextResponse.json({ error: "Gagal menghapus jadwal ruangan" }, { status: 500 });
  }
}
