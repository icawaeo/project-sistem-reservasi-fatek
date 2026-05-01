"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell, ChevronDown, LogOut, UserCog, User } from "lucide-react";
import Sidebar from "./Sidebar";

type NavbarProps = {
  pageTitle: string;
  pageSubtitle: string;
  userName: string;
  role?: "superadmin" | "admin";
};

export default function Navbar({
  pageTitle,
  pageSubtitle,
  userName,
  role,
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Auto-detect role from pathname if not provided
  const detectedRole = role || (
    pathname.includes("/administrator/superadmin/") ? "superadmin" : "admin"
  );

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!menuRef.current) return;
      if (!menuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="border-b border-slate-200 bg-white px-4 py-6 lg:px-7 lg:py-4">
      <div className="flex items-center justify-between gap-2 lg:gap-3">
        <div className="flex min-w-0 items-center gap-2 lg:gap-3">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 lg:hidden"
            aria-label="Buka menu"
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold text-slate-900 sm:text-base lg:text-lg">
              {pageTitle}
            </h1>
            <p className="truncate text-[11px] leading-tight text-slate-500 sm:text-xs">
              {pageSubtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-nowrap items-center gap-2 lg:gap-3">
          {/* <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Cari data user, ruangan, atau kegiatan"
              className="h-14 w-72 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-400"
            />
          </div> */}

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100"
            aria-label="Notifikasi"
          >
            <Bell size={14} />
          </button>

          <div className="relative shrink-0" ref={menuRef}>
            {/* Mobile: icon-only profile button */}
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-900 transition-colors hover:bg-slate-100 lg:hidden"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
            >
              <User size={16} />
            </button>

            {/* Desktop: name + chevron */}
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="hidden h-10 lg:flex items-center gap-2 rounded-lg border border-slate-200 px-3 text-slate-900 transition-colors hover:bg-slate-100"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
            >
              <User size={14} className="text-slate-500" aria-hidden="true" />
              <span className="text-sm font-semibold text-slate-900 max-w-35 truncate">{userName}</span>
              <ChevronDown size={14} className="text-slate-500" aria-hidden="true" />
            </button>

            {isMenuOpen ? (
              <div
                role="menu"
                aria-label="Menu akun"
                className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push("/administrator/profile");
                  }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <UserCog size={16} className="text-slate-500" aria-hidden="true" />
                  Ubah Profil
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-rose-700 hover:bg-rose-50"
                >
                  <LogOut size={16} className="text-rose-600" aria-hidden="true" />
                  Keluar
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Mobile sidebar drawer */}
      {isMobileSidebarOpen && detectedRole ? (
        <Sidebar role={detectedRole} isMobile onClose={() => setIsMobileSidebarOpen(false)} />
      ) : null}
    </header>
  );
}
