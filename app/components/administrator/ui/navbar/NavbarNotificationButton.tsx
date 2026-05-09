import { Bell } from "lucide-react";

export default function NavbarNotificationButton() {
  return (
    <button
      type="button"
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100"
      aria-label="Notifikasi"
    >
      <Bell size={14} />
    </button>
  );
}
