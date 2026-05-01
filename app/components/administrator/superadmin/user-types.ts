export type UserCategory = "umum" | "unsrat";

export type UserRoleValue =
  | "USER"
  | "ADMIN"
  | "ADMIN_DEKAN"
  | "ADMIN_WD2"
  | "KAJUR"
  | "KEPALA_LAB"
  | "SUPERADMIN";

export type UserRoleFilter = "ALL" | UserRoleValue;

export type UserItem = {
  id: string;
  name: string;
  email: string;
  userCategory: UserCategory;
  role: UserRoleValue;
  createdAt: string;
  isVerified: boolean;
  resendCooldownSeconds: number;
};

export type UserPayload = {
  name: string;
  email: string;
  userCategory: UserCategory;
  role: UserRoleValue;
};

export const USER_ROLE_OPTIONS: Array<{ value: UserRoleValue; label: string }> = [
  { value: "USER", label: "User" },
  { value: "ADMIN", label: "Admin" },
  { value: "ADMIN_DEKAN", label: "Admin (Dekan)" },
  { value: "ADMIN_WD2", label: "Admin (WD2)" },
  { value: "KAJUR", label: "Kepala Jurusan" },
  { value: "KEPALA_LAB", label: "Kepala Lab" },
  { value: "SUPERADMIN", label: "Superadmin" },
];

export const USER_CATEGORY_OPTIONS: Array<{ value: UserCategory; label: string }> = [
  { value: "umum", label: "Umum" },
  { value: "unsrat", label: "Unsrat" },
];

export const roleLabel = (role: UserRoleValue) => {
  const option = USER_ROLE_OPTIONS.find((item) => item.value === role);
  return option?.label ?? role;
};

export const categoryLabel = (value: UserCategory) => (value === "unsrat" ? "Unsrat" : "Umum");
