import "server-only";

type SessionLikeUser = {
  email?: string | null;
  userType?: string | null;
  role?: string | null;
};

export const ADMIN_DASHBOARD_PATH = "/administrator/admin/dashboard";
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
