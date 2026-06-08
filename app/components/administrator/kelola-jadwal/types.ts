import type { LabProgramValue } from "@/lib/lab-enums";

export type AdminRole = "SUPERADMIN" | "KAJUR" | "KAPRODI";

export type RoomOption = {
  id: string;
  name: string;
  building: string;
  location: string;
  labProgram: LabProgramValue | null;
  labDepartment: string | null;
  operationalDays: string[];
  openTime: string;
  closeTime: string;
};

export type ScheduleItem = {
  id: string;
  title: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  buildingName: string;
  departmentScope: string | null;
  departmentLabel: string | null;
  programScope: LabProgramValue | null;
  programLabel: string | null;
  room: {
    id: string;
    name: string;
    building: string;
  };
};

export type HolidayEvent = {
  date: string;
  title: string;
};

export type ScheduleFormState = {
  title: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  roomId: string;
  programScope: string;
};

export type ScheduleManagementContentProps = {
  adminRole: AdminRole;
  programScope: LabProgramValue | null;
};
