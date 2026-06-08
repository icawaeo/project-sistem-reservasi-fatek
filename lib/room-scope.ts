import { isLabBuilding } from "@/app/utils/building";
import type { LabDepartmentValue, LabProgramValue } from "@/lib/lab-enums";

export const LAB_PROGRAM_LABELS: Record<LabProgramValue, string> = {
  IT: "Informatika",
  ELEKTRO: "Teknik Elektro",
  ARSITEKTUR: "Arsitektur",
  PWK: "PWK",
  SIPIL: "Teknik Sipil",
  LINGKUNGAN: "Teknik Lingkungan",
  MESIN: "Teknik Mesin",
  INDUSTRI: "Teknik Industri",
};

export const LAB_DEPARTMENT_LABELS: Record<LabDepartmentValue, string> = {
  ELEKTRO: "Teknik Elektro",
  ARSITEKTUR: "Arsitektur",
  SIPIL: "Teknik Sipil",
  MESIN: "Teknik Mesin",
};

export const PROGRAM_TO_DEPARTMENT: Record<LabProgramValue, LabDepartmentValue> = {
  IT: "ELEKTRO",
  ELEKTRO: "ELEKTRO",
  ARSITEKTUR: "ARSITEKTUR",
  PWK: "ARSITEKTUR",
  SIPIL: "SIPIL",
  LINGKUNGAN: "SIPIL",
  MESIN: "MESIN",
  INDUSTRI: "MESIN",
};

export const DEPARTMENT_BUILDING_SCOPE: Record<
  string,
  { department: LabDepartmentValue; programs: LabProgramValue[] }
> = {
  "Gedung Jurusan Teknik Arsitektur": {
    department: "ARSITEKTUR",
    programs: ["PWK", "ARSITEKTUR"],
  },
  "Gedung Jurusan Teknik Elektro": {
    department: "ELEKTRO",
    programs: ["IT", "ELEKTRO"],
  },
  "Gedung Jurusan Teknik Sipil": {
    department: "SIPIL",
    programs: ["SIPIL", "LINGKUNGAN"],
  },
  "Gedung Jurusan Teknik Mesin": {
    department: "MESIN",
    programs: ["MESIN", "INDUSTRI"],
  },
};

export type RoomScopeLike = {
  room_building: string;
  labProgram?: LabProgramValue | null;
  labDepartment?: LabDepartmentValue | null;
};

export type UserScopeLike = {
  role?: string | null;
  departmentScope?: LabDepartmentValue | null;
  programScope?: LabProgramValue | null;
};

export function getDepartmentForProgram(program: LabProgramValue | null | undefined) {
  return program ? PROGRAM_TO_DEPARTMENT[program] : null;
}

export function getManagedBuildingScope(buildingName: string | null | undefined) {
  if (!buildingName) return null;
  return DEPARTMENT_BUILDING_SCOPE[buildingName] ?? null;
}

export function isDekanatBuilding(buildingName: string | null | undefined) {
  return (buildingName ?? "").toLowerCase() === "gedung dekanat fakultas teknik".toLowerCase();
}

export function isDepartmentManagedBuilding(buildingName: string | null | undefined) {
  return Boolean(getManagedBuildingScope(buildingName));
}

export function resolveRoomScope(room: RoomScopeLike) {
  if (isLabBuilding(room.room_building)) {
    const department = room.labDepartment ?? getDepartmentForProgram(room.labProgram ?? null);
    const programs = room.labProgram ? [room.labProgram] : [];
    return department ? { department, programs } : null;
  }

  return getManagedBuildingScope(room.room_building);
}

export function canUserAccessRoomScope(user: UserScopeLike, room: RoomScopeLike) {
  const role = (user.role ?? "").toUpperCase();
  if (role === "SUPERADMIN") return true;

  const scope = resolveRoomScope(room);
  if (!scope) return false;

  if (role === "KAJUR") {
    return Boolean(user.departmentScope && user.departmentScope === scope.department);
  }

  if (role === "KAPRODI") {
    return Boolean(user.programScope && scope.programs.includes(user.programScope));
  }

  return false;
}

export function canUserEditScheduleScope(params: {
  user: UserScopeLike;
  room: RoomScopeLike;
  scheduleDepartment: LabDepartmentValue | null;
  scheduleProgram: LabProgramValue | null;
}) {
  const role = (params.user.role ?? "").toUpperCase();
  if (role === "SUPERADMIN") return true;
  if (!canUserAccessRoomScope(params.user, params.room)) return false;

  if (role === "KAJUR") {
    return Boolean(params.user.departmentScope && params.scheduleDepartment === params.user.departmentScope);
  }

  if (role === "KAPRODI") {
    return Boolean(params.user.programScope && params.scheduleProgram === params.user.programScope);
  }

  return false;
}

export function normalizeScheduleProgramForUser(params: {
  user: UserScopeLike;
  room: RoomScopeLike;
  requestedProgram?: LabProgramValue | null;
}) {
  const role = (params.user.role ?? "").toUpperCase();
  const roomScope = resolveRoomScope(params.room);
  if (!roomScope) return null;

  if (role === "KAPRODI") {
    return params.user.programScope && roomScope.programs.includes(params.user.programScope)
      ? params.user.programScope
      : null;
  }

  if (params.requestedProgram && roomScope.programs.includes(params.requestedProgram)) {
    return params.requestedProgram;
  }

  if (isLabBuilding(params.room.room_building) && params.room.labProgram) {
    return params.room.labProgram;
  }

  return null;
}
