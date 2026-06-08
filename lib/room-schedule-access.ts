import "server-only";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { LabDepartmentValue, LabProgramValue } from "@/lib/lab-enums";
import { LAB_PROGRAM_VALUES } from "@/lib/lab-enums";
import {
  canUserAccessRoomScope,
  canUserEditScheduleScope,
  getDepartmentForProgram,
  normalizeScheduleProgramForUser,
  resolveRoomScope,
  type RoomScopeLike,
  type UserScopeLike,
} from "@/lib/room-scope";

export const SCHEDULE_BLOCK_TYPES = ["KULIAH", "PRAKTIKUM", "UJIAN", "RAPAT_RUTIN", "BLOKIR_MANUAL"] as const;
export type ScheduleBlockType = (typeof SCHEDULE_BLOCK_TYPES)[number];

export type ScheduleManagerUser = {
  id: string;
  role: "SUPERADMIN" | "KAJUR" | "KAPRODI";
  departmentScope: LabDepartmentValue | null;
  programScope: LabProgramValue | null;
};

export type AccessibleScheduleRoom = {
  room_id: string;
  room_name: string;
  room_building: string;
  room_locDetail: string;
  labProgram: LabProgramValue | null;
  labDepartment: LabDepartmentValue | null;
  operational_days: string[];
  open_time: string;
  close_time: string;
};

type AccessibleScheduleRoomRecord = {
  room_id: string;
  room_name: string;
  room_building: string;
  room_locDetail: string;
  labProgram: LabProgramValue | null;
  labDepartment: LabDepartmentValue | null;
  building: {
    operational_days: string[];
    open_time: string;
    close_time: string;
  };
};

export const parseScheduleBlockType = (value: unknown): ScheduleBlockType =>
  SCHEDULE_BLOCK_TYPES.includes(value as ScheduleBlockType) ? (value as ScheduleBlockType) : "KULIAH";

export const parseLabProgram = (value: unknown): LabProgramValue | null => {
  if (typeof value !== "string") return null;
  return LAB_PROGRAM_VALUES.includes(value as LabProgramValue) ? (value as LabProgramValue) : null;
};

export const isValidTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
export const isValidDateYmd = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export async function getScheduleManagerUser(): Promise<ScheduleManagerUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const dbUser = await prisma.user.findUnique({
    where: { user_id: session.user.id },
    select: {
      user_id: true,
      role: true,
      departmentScope: true,
      programScope: true,
    },
  });

  if (!dbUser) return null;
  if (dbUser.role !== "SUPERADMIN" && dbUser.role !== "KAJUR" && dbUser.role !== "KAPRODI") {
    return null;
  }

  return {
    id: dbUser.user_id,
    role: dbUser.role,
    departmentScope: dbUser.departmentScope,
    programScope: dbUser.programScope,
  };
}

export function canManageRoomSchedule(user: UserScopeLike, room: RoomScopeLike) {
  return canUserAccessRoomScope(user, room);
}

export async function getAccessibleScheduleRooms(user: ScheduleManagerUser): Promise<AccessibleScheduleRoom[]> {
  const rooms: AccessibleScheduleRoomRecord[] = await prisma.room.findMany({
    where: {
      room_isActive: true,
    },
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
    orderBy: [{ room_building: "asc" }, { room_name: "asc" }],
  });

  return rooms
    .filter((room) => canManageRoomSchedule(user, room))
    .map((room) => ({
      room_id: room.room_id,
      room_name: room.room_name,
      room_building: room.room_building,
      room_locDetail: room.room_locDetail,
      labProgram: room.labProgram,
      labDepartment: room.labDepartment,
      operational_days: room.building.operational_days,
      open_time: room.building.open_time,
      close_time: room.building.close_time,
    }));
}

export function resolveScheduleScopes(params: {
  user: ScheduleManagerUser;
  room: RoomScopeLike;
  requestedProgram?: LabProgramValue | null;
}) {
  const roomScope = resolveRoomScope(params.room);
  if (!roomScope) return null;

  const programScope = normalizeScheduleProgramForUser({
    user: params.user,
    room: params.room,
    requestedProgram: params.requestedProgram,
  });

  const departmentScope = programScope ? getDepartmentForProgram(programScope) : roomScope.department;
  if (!departmentScope) return null;

  return {
    departmentScope,
    programScope,
  };
}

export function canEditExistingSchedule(params: {
  user: ScheduleManagerUser;
  room: RoomScopeLike;
  departmentScope: LabDepartmentValue | null;
  programScope: LabProgramValue | null;
}) {
  return canUserEditScheduleScope({
    user: params.user,
    room: params.room,
    scheduleDepartment: params.departmentScope,
    scheduleProgram: params.programScope,
  });
}
