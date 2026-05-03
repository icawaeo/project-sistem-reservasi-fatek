export type RoomStatus = "aktif" | "maintenance";

export type LabProgramValue =
  | "IT"
  | "ELEKTRO"
  | "ARSITEKTUR"
  | "PWK"
  | "SIPIL"
  | "LINGKUNGAN"
  | "MESIN";

export type LabDepartmentValue = "ELEKTRO" | "ARSITEKTUR" | "SIPIL" | "MESIN";

export type RoomItem = {
  id: string;
  name: string;
  building: string;
  floor: string;
  capacity: number;
  facilities: string[];
  imageUrl: string | null;
  status: RoomStatus;
  labProgram: LabProgramValue | null;
  labDepartment: LabDepartmentValue | null;
};

export type RoomPayload = {
  name: string;
  building: string;
  floor: string;
  capacity: number;
  facilities: string[];
  imageUrl: string | null;
  status: RoomStatus;
  labProgram: LabProgramValue | null;
  labDepartment: LabDepartmentValue | null;
};
