"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell, ChevronDown, LogOut, UserCog } from "lucide-react";

type NavbarProps = {
  pageTitle: string;
  pageSubtitle: string;
  userName: string;
};

export default function Navbar({
  pageTitle,
  pageSubtitle,
  userName,
}: NavbarProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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
    <header className="border-b border-slate-200 bg-white px-4 py-3 lg:px-7">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{pageTitle}</h1>
          <p className="text-sm text-slate-500">{pageSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
            className="flex h-14 w-14 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100"
            aria-label="Notifikasi"
          >
            <Bell size={16} />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="flex h-14 items-center gap-2 rounded-lg border border-slate-200 px-3 text-slate-900 transition-colors hover:bg-slate-100"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
            >
              <span className="text-sm font-semibold text-slate-900">{userName}</span>
              <ChevronDown size={16} className="text-slate-500" aria-hidden="true" />
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
    </header>
  );
}
