import "server-only";

import type { LabDepartment, LabProgram } from "@prisma/client";

type SessionLikeUser = {
  email?: string | null;
  userType?: string | null;
  role?: string | null;
};

type AdminReservationRole = "ADMIN" | "ADMIN_DEKAN" | "ADMIN_WD2" | "KAJUR" | "KEPALA_LAB";

type AdminReservationViewer = {
  role: AdminReservationRole;
  departmentScope?: LabDepartment | null;
  programScope?: LabProgram | null;
};

type AdminReservationRecordLike = {
  flow: "GENERAL" | "LAB_SKRIPSI" | "LAB_LAINNYA";
  status: string;
  labDepartment: LabDepartment | null;
  labProgram: LabProgram | null;
};

const normalizeReservationStatus = (status: string) => (status ?? "").toUpperCase();

const GENERAL_ADMIN_ROLES: AdminReservationRole[] = ["ADMIN", "ADMIN_DEKAN", "ADMIN_WD2"];

const KAJUR_VISIBLE_STATUSES = new Set([
  "PENDING_KAJUR",
  "REJECTED_KAJUR",
  "PENDING_KEPALA_LAB",
  "REJECTED_KEPALA_LAB",
  "APPROVED",
  "DISETUJUI",
  "COMPLETED",
  "SELESAI",
]);

const KEPALA_LAB_VISIBLE_STATUSES = new Set([
  "PENDING_KEPALA_LAB",
  "REJECTED_KEPALA_LAB",
  "APPROVED",
  "DISETUJUI",
  "COMPLETED",
  "SELESAI",
]);

export function shouldShowAdminReservation(viewer: AdminReservationViewer, reservation: AdminReservationRecordLike) {
  if (GENERAL_ADMIN_ROLES.includes(viewer.role)) {
    return true;
  }

  const status = normalizeReservationStatus(reservation.status);

  if (viewer.role === "KAJUR") {
    if (!viewer.departmentScope || reservation.flow !== "LAB_LAINNYA") {
      return false;
    }

    return reservation.labDepartment === viewer.departmentScope && KAJUR_VISIBLE_STATUSES.has(status);
  }

  if (viewer.role === "KEPALA_LAB") {
    if (!viewer.programScope || reservation.flow === "GENERAL") {
      return false;
    }

    return reservation.labProgram === viewer.programScope && KEPALA_LAB_VISIBLE_STATUSES.has(status);
  }

  return false;
}

export const ADMIN_DASHBOARD_PATH = "/administrator/admin";
export const SUPERADMIN_DASHBOARD_PATH = "/administrator/superadmin/dashboard";

export function isSuperadminUser(user: SessionLikeUser | null | undefined) {
  if (!user) {
    return false;
  }

  if (user.role === "SUPERADMIN") {
    return true;
  }

  const configuredEmails = (process.env.SUPERADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  const userEmail = user.email?.toLowerCase() ?? "";

  if (configuredEmails.length > 0) {
    return configuredEmails.includes(userEmail);
  }

  if (user.role) {
    return false;
  }

  return user.userType === "STAFF";
}

export function getPostLoginRedirectPath(user: SessionLikeUser | null | undefined) {
  if (!user) {
    return "/auth";
  }

  if (user.role === "SUPERADMIN") {
    return SUPERADMIN_DASHBOARD_PATH;
  }

  if (user.role === "ADMIN" || user.role === "ADMIN_DEKAN" || user.role === "ADMIN_WD2") {
    return ADMIN_DASHBOARD_PATH;
  }

  if (user.role === "USER") {
    return "/landingpage";
  }

  if (user.userType === "STAFF") {
    return isSuperadminUser(user) ? SUPERADMIN_DASHBOARD_PATH : ADMIN_DASHBOARD_PATH;
  }

  return "/landingpage";
}
