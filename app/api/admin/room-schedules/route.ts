import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { validateBuildingOperationalWindow } from "@/lib/building-operational-policy";
import { getHolidayCalendarStatus, getHolidayEventsBetween } from "@/lib/holiday-calendar";
import { getRequestLogMeta, logServerError } from "@/lib/server-logger";
import {
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

const toDateOnly = (dateYmd: string) => new Date(`${dateYmd}T00:00:00.000Z`);
const formatDateYmd = (date: Date) => date.toISOString().slice(0, 10);

const mapRoom = (room: {
  room_id: string;
  room_name: string;
  room_building: string;
  room_locDetail: string;
  labProgram: string | null;
  labDepartment: string | null;
  operational_days: string[];
  open_time: string;
  close_time: string;
}) => ({
  id: room.room_id,
  name: room.room_name,
  building: room.room_building,
  location: room.room_locDetail,
  labProgram: room.labProgram,
  labDepartment: room.labDepartment,
  operationalDays: room.operational_days,
  openTime: room.open_time,
  closeTime: room.close_time,
});

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

export async function GET(request: Request) {
  try {
    const user = await getScheduleManagerUser();
    if (!user) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const url = new URL(request.url);
    const month = url.searchParams.get("month");
    const roomId = url.searchParams.get("roomId");

    const accessibleRooms = await getAccessibleScheduleRooms(user);
    const accessibleRoomIds = new Set(accessibleRooms.map((room) => room.room_id));

    if (accessibleRoomIds.size === 0) {
      return NextResponse.json({ rooms: [], schedules: [] });
    }

    const monthStart = month && /^\d{4}-\d{2}$/.test(month) ? `${month}-01` : null;
    const monthEnd = monthStart
      ? new Date(Date.UTC(Number(monthStart.slice(0, 4)), Number(monthStart.slice(5, 7)), 0)).toISOString().slice(0, 10)
      : null;

    const dateFilter = monthStart
      ? {
          gte: toDateOnly(monthStart),
          lt: new Date(Date.UTC(Number(monthStart.slice(0, 4)), Number(monthStart.slice(5, 7)), 1)),
        }
      : undefined;

    let holidays: Awaited<ReturnType<typeof getHolidayEventsBetween>> = [];
    let holidayCalendarError: string | null = null;
    if (monthStart && monthEnd) {
      try {
        holidays = await getHolidayEventsBetween(monthStart, monthEnd);
      } catch (error) {
        holidayCalendarError = error instanceof Error ? error.message : "Gagal membaca kalender tanggal merah.";
        logServerError("[api/admin/room-schedules] Failed to fetch holiday calendar", error, getRequestLogMeta(request));
      }
    }

    const schedules = await prisma.roomScheduleBlock.findMany({
      where: {
        isActive: true,
        roomId: {
          in: roomId && accessibleRoomIds.has(roomId) ? [roomId] : Array.from(accessibleRoomIds),
        },
        ...(dateFilter ? { scheduleDate: dateFilter } : {}),
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
      orderBy: [{ scheduleDate: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json({
      rooms: accessibleRooms.map(mapRoom),
      schedules: schedules.map(mapSchedule),
      holidays,
      holidayCalendar: getHolidayCalendarStatus(),
      holidayCalendarError,
      googleCalendarReady: true,
    });
  } catch (error) {
    logServerError("[api/admin/room-schedules] Failed to fetch schedules", error, getRequestLogMeta(request));
    return NextResponse.json({ error: "Gagal mengambil jadwal ruangan" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getScheduleManagerUser();
    if (!user) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

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

    const room = await prisma.room.findUnique({
      where: { room_id: roomId },
      select: {
        room_id: true,
        room_name: true,
        room_building: true,
        room_locDetail: true,
        labProgram: true,
        labDepartment: true,
        building: {
          select: {
            operational_days: true,
            open_time: true,
            close_time: true,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Ruangan tidak ditemukan." }, { status: 404 });
    }

    const accessibleRooms = await getAccessibleScheduleRooms(user);
    if (!accessibleRooms.some((item) => item.room_id === room.room_id)) {
      return NextResponse.json({ error: "Anda tidak berwenang mengelola jadwal ruangan ini." }, { status: 403 });
    }

    const scopes = resolveScheduleScopes({ user, room, requestedProgram });
    if (!scopes) {
      return NextResponse.json({ error: "Scope jadwal tidak sesuai dengan role Anda." }, { status: 403 });
    }

    const operationalCheck = validateBuildingOperationalWindow({
      startDate: date,
      endDate: date,
      startTime,
      endTime,
      schedule: room.building,
    });

    if (!operationalCheck.ok) {
      return NextResponse.json({ error: operationalCheck.error }, { status: 400 });
    }

    const conflictCheck = await validateScheduleBlockDoesNotConflict({
      roomId,
      date,
      startTime,
      endTime,
    });

    if (!conflictCheck.ok) {
      return NextResponse.json({ error: conflictCheck.error }, { status: 409 });
    }

    const created = await prisma.roomScheduleBlock.create({
      data: {
        title,
        type,
        scheduleDate: toDateOnly(date),
        startTime,
        endTime,
        buildingName: room.room_building,
        departmentScope: scopes.departmentScope,
        programScope: scopes.programScope,
        roomId,
        createdById: user.id,
        updatedById: user.id,
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

    return NextResponse.json({ schedule: mapSchedule(created) }, { status: 201 });
  } catch (error) {
    logServerError("[api/admin/room-schedules] Failed to create schedule", error, getRequestLogMeta(request));
    return NextResponse.json({ error: "Gagal menyimpan jadwal ruangan" }, { status: 500 });
  }
}
