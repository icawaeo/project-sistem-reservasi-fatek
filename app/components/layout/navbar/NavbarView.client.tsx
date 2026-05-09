"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import dynamic from "next/dynamic";

const PanduanPeminjamanModal = dynamic(() => import("@/app/components/user/PanduanPeminjamanModal"), {
  ssr: false,
});

import NavbarAuthDesktop from "./NavbarAuthDesktop";
import NavbarBrand from "./NavbarBrand";
import NavbarDesktopNav from "./NavbarDesktopNav";
import NavbarGuideButton from "./NavbarGuideButton";
import NavbarHamburgerButton from "./NavbarHamburgerButton";
import NavbarMobileMenu from "./NavbarMobileMenu";
import { getHeaderClassName, getHeaderTopOffset, getSurfaceClassName, SCROLL_PIN_THRESHOLD } from "./styles";
import type { NavbarUser } from "./types";

type NavbarViewProps = {
  user: NavbarUser;
};

export default function NavbarView({ user }: NavbarViewProps) {
  const pathname = usePathname();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

  const isPrivilegedStaff = user?.userType === "STAFF";
  const showUserMenu = Boolean(user) && !isPrivilegedStaff;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }

      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        mobileMenuButtonRef.current &&
        !mobileMenuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > SCROLL_PIN_THRESHOLD);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isHomeActive = useMemo(() => pathname === "/landingpage" || pathname.startsWith("/gedung"), [pathname]);
  const isHistoryActive = useMemo(() => pathname.startsWith("/riwayat"), [pathname]);

  const headerTopOffset = getHeaderTopOffset(isScrolled);
  const headerClassName = getHeaderClassName(isScrolled);
  const surfaceClassName = getSurfaceClassName(isScrolled);

  const userName = (user?.name ?? "Pengguna").trim() || "Pengguna";
  const userNameLabel = user ? `Hi, ${userName}` : "Menu";

  return (
    <>
      <header
        className={`${headerClassName} transition-[top,width,transform] duration-300 ease-out`}
        style={{ top: headerTopOffset }}
      >
        <div className="relative w-full">
          <div className={`${surfaceClassName} transition-all duration-300 ease-out`}>
            <NavbarBrand />
            <NavbarDesktopNav isHomeActive={isHomeActive} isHistoryActive={isHistoryActive} />

            <nav className="hidden lg:flex items-center gap-3 shrink-0">
              <NavbarGuideButton
                onClick={() => {
                  setIsDropdownOpen(false);
                  setIsGuideOpen(true);
                }}
              />

              <NavbarAuthDesktop
                showUserMenu={showUserMenu}
                userName={userName}
                isDropdownOpen={isDropdownOpen}
                dropdownRef={dropdownRef}
                onToggleDropdown={() => setIsDropdownOpen((prev) => !prev)}
                onLogout={() => signOut({ callbackUrl: "/" })}
              />
            </nav>

            <NavbarHamburgerButton
              isMobileMenuOpen={isMobileMenuOpen}
              buttonRef={mobileMenuButtonRef}
              onClick={() => {
                setIsDropdownOpen(false);
                setIsMobileMenuOpen((prev) => !prev);
              }}
            />
          </div>

          <NavbarMobileMenu
            open={isMobileMenuOpen}
            menuRef={mobileMenuRef}
            isHomeActive={isHomeActive}
            isHistoryActive={isHistoryActive}
            userNameLabel={userNameLabel}
            showUserMenu={showUserMenu}
            onNavigate={() => setIsMobileMenuOpen(false)}
            onOpenGuide={() => {
              setIsDropdownOpen(false);
              setIsMobileMenuOpen(false);
              setIsGuideOpen(true);
            }}
            onLogout={() => {
              setIsMobileMenuOpen(false);
              signOut({ callbackUrl: "/" });
            }}
          />
        </div>
      </header>

      {isGuideOpen && (
        <PanduanPeminjamanModal open={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      )}
    </>
  );
}
