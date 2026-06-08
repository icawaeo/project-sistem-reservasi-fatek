import "server-only";

import type { LabDepartmentValue, LabProgramValue } from "@/lib/lab-enums";
import { getManagedBuildingScope, isDekanatBuilding } from "@/lib/room-scope";

type SessionLikeUser = {
  email?: string | null;
  userType?: string | null;
  role?: string | null;
};

type AdminReservationRole = "ADMIN" | "ADMIN_DEKAN" | "ADMIN_WD2" | "KAJUR" | "KAPRODI" | "KEPALA_LAB";

type AdminReservationViewer = {
  role: AdminReservationRole;
  departmentScope?: LabDepartmentValue | null;
  programScope?: LabProgramValue | null;
};

type AdminReservationRecordLike = {
  flow: "GENERAL" | "LAB_SKRIPSI" | "LAB_LAINNYA";
  status: string;
  labDepartment: LabDepartmentValue | null;
  labProgram: LabProgramValue | null;
  roomBuilding?: string | null;
};

const normalizeReservationStatus = (status: string) => (status ?? "").toUpperCase();

const COMMON_FINAL_STATUSES = [
  "APPROVED",
  "DISETUJUI",
  "COMPLETED",
  "SELESAI",
  "CANCELLED",
  "DIBATALKAN",
];

const KABAG_VISIBLE_STATUSES = new Set([
  "PENDING",
  "PENDING_KABAG",
  "REJECTED_KABAG",
  "PENDING_DEKAN",
  "REJECTED_DEKAN",
  "PENDING_WD2",
  "PENDING_WAKIL_DEKAN_2",
  "REJECTED_WD2",
  "PENDING_KAJUR",
  "REJECTED_KAJUR",
  "PENDING_KEPALA_LAB",
  "REJECTED_KEPALA_LAB",
  ...COMMON_FINAL_STATUSES,
]);

const DEKAN_VISIBLE_STATUSES = new Set([
  "PENDING_DEKAN",
  "REJECTED_DEKAN",
  "PENDING_WD2",
  "PENDING_WAKIL_DEKAN_2",
  "REJECTED_WD2",
  ...COMMON_FINAL_STATUSES,
]);

const WD2_VISIBLE_STATUSES = new Set([
  "PENDING_WD2",
  "PENDING_WAKIL_DEKAN_2",
  "REJECTED_WD2",
  ...COMMON_FINAL_STATUSES,
]);

const KAJUR_VISIBLE_STATUSES = new Set([
  "PENDING_KAJUR",
  "REJECTED_KAJUR",
  "PENDING_KEPALA_LAB",
  "REJECTED_KEPALA_LAB",
  ...COMMON_FINAL_STATUSES,
]);

const OBSERVER_VISIBLE_STATUSES = new Set([
  "PENDING",
  "PENDING_KABAG",
  "PENDING_DEKAN",
  "REJECTED_DEKAN",
  "PENDING_WD2",
  "PENDING_WAKIL_DEKAN_2",
  "REJECTED_WD2",
  ...COMMON_FINAL_STATUSES,
]);

const KEPALA_LAB_VISIBLE_STATUSES = new Set([
  "PENDING_KEPALA_LAB",
  "REJECTED_KEPALA_LAB",
  ...COMMON_FINAL_STATUSES,
]);

export function shouldShowAdminReservation(viewer: AdminReservationViewer, reservation: AdminReservationRecordLike) {
  const status = normalizeReservationStatus(reservation.status);

  if (viewer.role === "ADMIN") {
    return KABAG_VISIBLE_STATUSES.has(status);
  }

  if (viewer.role === "ADMIN_DEKAN") {
    if (reservation.flow !== "GENERAL") return false;
    return DEKAN_VISIBLE_STATUSES.has(status);
  }

  if (viewer.role === "ADMIN_WD2") {
    if (reservation.flow !== "GENERAL") return false;
    return WD2_VISIBLE_STATUSES.has(status);
  }

  if (viewer.role === "KAJUR") {
    if (!viewer.departmentScope) {
      return false;
    }

    if (reservation.flow === "LAB_LAINNYA") {
      return reservation.labDepartment === viewer.departmentScope && KAJUR_VISIBLE_STATUSES.has(status);
    }

    if (reservation.flow === "GENERAL") {
      const roomScope = getManagedBuildingScope(reservation.roomBuilding);
      return Boolean(
        roomScope &&
          !isDekanatBuilding(reservation.roomBuilding) &&
          roomScope.department === viewer.departmentScope &&
          OBSERVER_VISIBLE_STATUSES.has(status),
      );
    }

    return false;
  }

  if (viewer.role === "KAPRODI") {
    if (!viewer.programScope || reservation.flow !== "GENERAL") {
      return false;
    }

    const roomScope = getManagedBuildingScope(reservation.roomBuilding);
    return Boolean(
      roomScope &&
        !isDekanatBuilding(reservation.roomBuilding) &&
        roomScope.programs.includes(viewer.programScope) &&
        OBSERVER_VISIBLE_STATUSES.has(status),
    );
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

  if (user.role === "ADMIN" || user.role === "ADMIN_DEKAN" || user.role === "ADMIN_WD2" || user.role === "KAJUR" || user.role === "KAPRODI" || user.role === "KEPALA_LAB") {
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
