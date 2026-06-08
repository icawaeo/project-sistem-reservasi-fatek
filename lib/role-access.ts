const ADMIN_ROLES = new Set(["ADMIN", "ADMIN_DEKAN", "ADMIN_WD2", "KAJUR", "KAPRODI", "KEPALA_LAB", "SUPERADMIN"]);

export const isAdminRole = (role: string | null | undefined) => ADMIN_ROLES.has(role ?? "");

export const isPrivilegedStaffUser = (user: {
  userType?: string | null;
  role?: string | null;
} | null | undefined) => user?.userType === "STAFF" && isAdminRole(user.role);

export const isPublicReservationUser = (user: {
  userType?: string | null;
  role?: string | null;
} | null | undefined) => Boolean(user) && !isPrivilegedStaffUser(user);
