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
import NotificationDropdown from "@/app/components/administrator/ui/notification/NotificationDropdown";
import type { AdminNavbarRole, AdminNavbarViewProps } from "./types";

export default function NavbarView({ pageTitle, pageSubtitle, userName, role, showSidebar }: AdminNavbarViewProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const notificationRef = useRef<HTMLDivElement | null>(null);

  const detectedRole: AdminNavbarRole = useMemo(() => {
    if (role) return role;
    return pathname.includes("/administrator/superadmin/") ? "superadmin" : "admin";
  }, [pathname, role]);

  // Fetch unread count every 30 seconds
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch(`/api/notifications?unreadOnly=true`);
        if (!res.ok) throw new Error('Failed to fetch unread count');
        const data = await res.json();
        setUnreadCount(data.totalCount);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount(); // Initial fetch
    const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Handle clicks outside of notification dropdown and menu
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;

      // Check if click is outside menu
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }

      // Check if click is outside notification dropdown
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setShowNotifications(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setShowNotifications(false);
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

  const hasSidebar = showSidebar ?? detectedRole !== "admin";

  return (
    <NavbarShell>
      <div className="flex items-center justify-between gap-2 lg:gap-3">
        <div className="flex min-w-0 items-center gap-2 lg:gap-3">
          {hasSidebar ? (
            <NavbarMobileSidebarButton onClick={() => setIsMobileSidebarOpen(true)} />
          ) : null}
          <NavbarTitles title={pageTitle} subtitle={pageSubtitle} />
        </div>

        <div className="flex flex-nowrap items-center gap-2 lg:gap-3">
          <div className="relative" ref={notificationRef}>
            <NavbarNotificationButton 
              onClick={() => setShowNotifications(!showNotifications)}
              unreadCount={unreadCount}
            />
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <NotificationDropdown />
              </div>
            )}
          </div>

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

      {hasSidebar ? (
        <NavbarMobileSidebarDrawer
          open={isMobileSidebarOpen}
          role={detectedRole}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
      ) : null}
    </NavbarShell>
  );
}
