export type UserRoleValue =
  | "USER"
  | "ADMIN"
  | "ADMIN_DEKAN"
  | "ADMIN_WD2"
  | "KAJUR"
  | "KAPRODI"
  | "KEPALA_LAB"
  | "SUPERADMIN";

export type UserRoleFilter = "ALL" | UserRoleValue;

export type UserItem = {
  id: string;
  name: string;
  email: string;
  role: UserRoleValue;
  departmentScope: LabDepartmentValue | null;
  programScope: LabProgramValue | null;
  createdAt: string;
  isVerified: boolean;
  resendCooldownSeconds: number;
};

export type UserPayload = {
  name: string;
  email: string;
  role: UserRoleValue;
  departmentScope: LabDepartmentValue | null;
  programScope: LabProgramValue | null;
};

export type LabDepartmentValue = "ELEKTRO" | "ARSITEKTUR" | "SIPIL" | "MESIN";

export type LabProgramValue =
  | "IT"
  | "ELEKTRO"
  | "ARSITEKTUR"
  | "PWK"
  | "SIPIL"
  | "LINGKUNGAN"
  | "MESIN"
  | "INDUSTRI";

export const USER_ROLE_OPTIONS: Array<{ value: UserRoleValue; label: string }> = [
  { value: "USER", label: "User" },
  { value: "ADMIN", label: "Admin" },
  { value: "ADMIN_DEKAN", label: "Admin (Dekan)" },
  { value: "ADMIN_WD2", label: "Admin (WD2)" },
  { value: "KAJUR", label: "Kepala Jurusan" },
  { value: "KAPRODI", label: "Koordinator Program Studi" },
  { value: "KEPALA_LAB", label: "Kepala Lab" },
  { value: "SUPERADMIN", label: "Superadmin" },
];

export const LAB_DEPARTMENT_OPTIONS: Array<{ value: LabDepartmentValue; label: string }> = [
  { value: "ELEKTRO", label: "Teknik Elektro" },
  { value: "ARSITEKTUR", label: "Arsitektur" },
  { value: "SIPIL", label: "Teknik Sipil" },
  { value: "MESIN", label: "Teknik Mesin" },
];

export const LAB_PROGRAM_OPTIONS: Array<{ value: LabProgramValue; label: string }> = [
  { value: "IT", label: "Informatika" },
  { value: "ELEKTRO", label: "Teknik Elektro" },
  { value: "ARSITEKTUR", label: "Arsitektur" },
  { value: "PWK", label: "PWK" },
  { value: "SIPIL", label: "Teknik Sipil" },
  { value: "LINGKUNGAN", label: "Teknik Lingkungan" },
  { value: "MESIN", label: "Teknik Mesin" },
  { value: "INDUSTRI", label: "Teknik Industri" },
];

export const roleLabel = (role: UserRoleValue) => {
  const option = USER_ROLE_OPTIONS.find((item) => item.value === role);
  return option?.label ?? role;
};
