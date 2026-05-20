import Link from "next/link";
import { ChevronDown, CircleUserRound, LogOut } from "lucide-react";
import type { RefObject } from "react";

import { actionButtonClassName, loginButtonClassName } from "./styles";

type NavbarAuthDesktopProps = {
  showUserMenu: boolean;
  userName: string;
  isDropdownOpen: boolean;
  dropdownRef: RefObject<HTMLDivElement | null>;
  onToggleDropdown: () => void;
  onLogout: () => void;
};

export default function NavbarAuthDesktop({
  showUserMenu,
  userName,
  isDropdownOpen,
  dropdownRef,
  onToggleDropdown,
  onLogout,
}: NavbarAuthDesktopProps) {
  if (!showUserMenu) {
    return (
      <Link href="/auth?tab=login" className={loginButtonClassName}>
        Masuk
      </Link>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button onClick={onToggleDropdown} className={actionButtonClassName} type="button">
        <CircleUserRound size={16} />
        <span className="max-w-28 truncate">Hi, {userName}</span>
        <ChevronDown
          size={13}
          className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100"
            type="button"
          >
            <LogOut size={15} />
            Keluar
          </button>
        </div>
      )}
    </div>
  );
}
