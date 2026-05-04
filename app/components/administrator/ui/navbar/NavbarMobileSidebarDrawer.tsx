import Sidebar from "../Sidebar";
import type { AdminNavbarRole } from "./types";

type NavbarMobileSidebarDrawerProps = {
  open: boolean;
  role: AdminNavbarRole;
  onClose: () => void;
};

export default function NavbarMobileSidebarDrawer({ open, role, onClose }: NavbarMobileSidebarDrawerProps) {
  if (!open) return null;

  return <Sidebar role={role} isMobile onClose={onClose} />;
}
