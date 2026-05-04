import { ChevronDown, LogOut, User, UserCog } from "lucide-react";
import type { RefObject } from "react";

type NavbarAccountMenuProps = {
  userName: string;
  open: boolean;
  menuRef: RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
};

export default function NavbarAccountMenu({
  userName,
  open,
  menuRef,
  onToggle,
  onOpenProfile,
  onLogout,
}: NavbarAccountMenuProps) {
  return (
    <div className="relative shrink-0" ref={menuRef}>
      {/* Mobile: icon-only profile button */}
      <button
        type="button"
        onClick={onToggle}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-900 transition-colors hover:bg-slate-100 lg:hidden"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <User size={16} />
      </button>

      {/* Desktop: name + chevron */}
      <button
        type="button"
        onClick={onToggle}
        className="hidden h-10 lg:flex items-center gap-2 rounded-lg border border-slate-200 px-3 text-slate-900 transition-colors hover:bg-slate-100"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <User size={14} className="text-slate-500" aria-hidden="true" />
        <span className="text-sm font-semibold text-slate-900 max-w-35 truncate">{userName}</span>
        <ChevronDown size={14} className="text-slate-500" aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Menu akun"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md"
        >
          <button
            type="button"
            role="menuitem"
            onClick={onOpenProfile}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <UserCog size={16} className="text-slate-500" aria-hidden="true" />
            Ubah Profil
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={onLogout}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-rose-700 hover:bg-rose-50"
          >
            <LogOut size={16} className="text-rose-600" aria-hidden="true" />
            Keluar
          </button>
        </div>
      ) : null}
    </div>
  );
}
