export type AdminNavbarRole = "superadmin" | "admin";

export type AdminNavbarProps = {
  pageTitle: string;
  pageSubtitle: string;
  /**
   * Optional explicit role. If omitted, the client view will infer from pathname.
   */
  role?: AdminNavbarRole;
  /**
   * Optional override (mainly for testing). Usually resolved from session in the server wrapper.
   */
  userName?: string;
};

export type AdminNavbarViewProps = Omit<AdminNavbarProps, "userName"> & {
  userName: string;
};
