import Link from "next/link";
import { CircleUserRound } from "lucide-react";
import type { RefObject } from "react";

import { mobileItemActive, mobileItemBase, mobileItemInactive } from "./styles";

type NavbarMobileMenuProps = {
  open: boolean;
  menuRef: RefObject<HTMLDivElement | null>;
  isHomeActive: boolean;
  isHistoryActive: boolean;
  userNameLabel: string;
  showUserMenu: boolean;
  onNavigate: () => void;
  onOpenGuide: () => void;
  onLogout: () => void;
};

export default function NavbarMobileMenu({
  open,
  menuRef,
  isHomeActive,
  isHistoryActive,
  userNameLabel,
  showUserMenu,
  onNavigate,
  onOpenGuide,
  onLogout,
}: NavbarMobileMenuProps) {
  if (!open) return null;

  return (
    <div
      id="mobile-menu"
      ref={menuRef}
      className="lg:hidden absolute left-0 right-0 top-full z-50 mt-2 w-full rounded-2xl bg-white px-4 sm:px-6 pb-4 ring-1 ring-slate-200 shadow-lg"
    >
      <div className="pt-4 pb-3 flex items-center gap-3">
        <CircleUserRound size={20} className="shrink-0 text-slate-900" />
        <div className="min-w-0 text-slate-900 text-sm font-semibold truncate">{userNameLabel}</div>
      </div>

      <div className="border-t border-slate-200" />

      <div className="pt-3 space-y-1">
        <Link
          href="/landingpage"
          onClick={onNavigate}
          className={`${mobileItemBase} ${isHomeActive ? mobileItemActive : mobileItemInactive}`}
        >
          Beranda
        </Link>

        <Link
          href="/riwayat"
          onClick={onNavigate}
          className={`${mobileItemBase} ${isHistoryActive ? mobileItemActive : mobileItemInactive}`}
        >
          Riwayat
        </Link>

        <button type="button" className={`${mobileItemBase} ${mobileItemInactive}`} onClick={onOpenGuide}>
          Lihat Panduan
        </button>

        {showUserMenu ? (
          <button type="button" className={`${mobileItemBase} text-red-600 hover:bg-red-50`} onClick={onLogout}>
            Keluar
          </button>
        ) : (
          <Link href="/auth?tab=login" onClick={onNavigate} className={`${mobileItemBase} ${mobileItemInactive}`}>
            Masuk
          </Link>
        )}
      </div>
    </div>
  );
}
