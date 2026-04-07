import "server-only";

type SessionLikeUser = {
  email?: string | null;
  userType?: string | null;
};

export const ADMIN_DASHBOARD_PATH = "/administrator/admin/dashboard";
export const SUPERADMIN_DASHBOARD_PATH = "/administrator/superadmin/dashboard";

export function isSuperadminUser(user: SessionLikeUser | null | undefined) {
  if (!user) {
    return false;
  }

  const configuredEmails = (process.env.SUPERADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  const userEmail = user.email?.toLowerCase() ?? "";

  if (configuredEmails.length > 0) {
    return configuredEmails.includes(userEmail);
  }

  return user.userType === "STAFF";
}

export function getPostLoginRedirectPath(user: SessionLikeUser | null | undefined) {
  if (!user) {
    return "/auth";
  }

  if (user.userType === "STAFF") {
    return isSuperadminUser(user) ? SUPERADMIN_DASHBOARD_PATH : ADMIN_DASHBOARD_PATH;
  }

  return "/landingpage";
}
