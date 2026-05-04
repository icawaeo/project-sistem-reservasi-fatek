"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

import NavbarAccountMenu from "./NavbarAccountMenu";
import NavbarMobileSidebarButton from "./NavbarMobileSidebarButton";
import NavbarMobileSidebarDrawer from "./NavbarMobileSidebarDrawer";
import NavbarNotificationButton from "./NavbarNotificationButton";
import NavbarShell from "./NavbarShell";
import NavbarTitles from "./NavbarTitles";
import type { AdminNavbarRole, AdminNavbarViewProps } from "./types";

export default function NavbarView({ pageTitle, pageSubtitle, userName, role }: AdminNavbarViewProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);

  const detectedRole: AdminNavbarRole = useMemo(() => {
    if (role) return role;
    return pathname.includes("/administrator/superadmin/") ? "superadmin" : "admin";
  }, [pathname, role]);

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
    <NavbarShell>
      <div className="flex items-center justify-between gap-2 lg:gap-3">
        <div className="flex min-w-0 items-center gap-2 lg:gap-3">
          <NavbarMobileSidebarButton onClick={() => setIsMobileSidebarOpen(true)} />
          <NavbarTitles title={pageTitle} subtitle={pageSubtitle} />
        </div>

        <div className="flex flex-nowrap items-center gap-2 lg:gap-3">
          <NavbarNotificationButton />

          <NavbarAccountMenu
            userName={userName}
            open={isMenuOpen}
            menuRef={menuRef}
            onToggle={() => setIsMenuOpen((prev) => !prev)}
            onOpenProfile={() => {
              setIsMenuOpen(false);
              router.push("/administrator/profile");
            }}
            onLogout={() => signOut({ callbackUrl: "/" })}
          />
        </div>
      </div>

      <NavbarMobileSidebarDrawer
        open={isMobileSidebarOpen}
        role={detectedRole}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
    </NavbarShell>
  );
}
