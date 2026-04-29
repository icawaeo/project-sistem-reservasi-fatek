"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ChevronDown, CircleUserRound, LogOut } from "lucide-react";
import PanduanPeminjamanModal from "@/app/components/user/PanduanPeminjamanModal";

const SCROLL_PIN_THRESHOLD = 0;

export default function Navbar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
    const isPrivilegedStaff = session?.user?.userType === "STAFF";
    const showUserMenu = Boolean(session?.user) && !isPrivilegedStaff;

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

    const isHomeActive = pathname === "/landingpage" || pathname.startsWith("/gedung");
    const isHistoryActive = pathname.startsWith("/riwayat");

    const headerTopOffset = isScrolled ? 0 : 24;

    const navMenuClassName = "flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 p-1";

    const linkBase = "rounded-full px-4 py-1.5 text-sm font-semibold tracking-tight transition-colors";
    const linkActive = "bg-slate-200 text-slate-900";
    const linkInactive = "text-slate-700 hover:bg-white hover:text-slate-900";

    const headerClassName = isScrolled
        ? "fixed left-0 right-0 z-50"
        : "fixed left-1/2 z-50 w-[calc(100%-2rem)] max-w-[1700px] -translate-x-1/2";

    const surfaceClassName = isScrolled
        ? "mx-auto flex w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 py-3 text-slate-900 shadow-md backdrop-blur-xl backdrop-saturate-150"
        : "flex w-full items-center justify-between rounded-full bg-white px-4 sm:px-6 lg:px-8 py-3 text-slate-900 backdrop-blur-xl ring-1 ring-slate-200 shadow-lg";

    const brandTitleClassName = "text-slate-900 font-bold text-xs sm:text-sm leading-tight";
    const brandSubtitleClassName = "text-slate-700 text-[10px] sm:text-[11px] leading-tight";

    const actionButtonClassName = "flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-all";

    const loginButtonClassName = "flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-6 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-all";

    const guideButtonClassName =
        "inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800";

    const mobileItemBase = "block w-full text-left rounded-xl px-4 py-3 text-sm font-semibold tracking-tight transition-colors";
    const mobileItemActive = "bg-slate-100 text-slate-900";
    const mobileItemInactive = "text-slate-700 hover:bg-slate-50 hover:text-slate-900";

    const hamburgerButtonClassName =
        "inline-flex items-center justify-center rounded-full border border-slate-300 bg-white p-2 text-slate-900 hover:bg-slate-50 transition-all";

    return (
        <>
        <header
            className={`${headerClassName} transition-[top,width,transform] duration-300 ease-out`}
            style={{ top: headerTopOffset }}
        >
            <div className="relative w-full">
                <div className={`${surfaceClassName} transition-all duration-300 ease-out`}>
                    <div className="flex items-center gap-3 shrink-0">
                        <Link href="/landingpage" aria-label="Ke halaman beranda">
                            <Image
                                src="/images/Logo_Fatek_Unsrat.png"
                                alt="Logo Fakultas Teknik Unsrat"
                                width={36}
                                height={36}
                                className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 object-contain"
                                priority
                            />
                        </Link>
                        <div className="min-w-0">
                            <div className={brandTitleClassName}>Fakultas Teknik</div>
                            <div className={brandSubtitleClassName}>Universitas Sam Ratulangi</div>
                        </div>
                    </div>

                    <div className="hidden lg:flex flex-1 justify-center px-4">
                        <nav className={navMenuClassName}>
                            <Link
                                href="/landingpage"
                                className={`${linkBase} ${isHomeActive ? linkActive : linkInactive}`}
                            >
                                Beranda
                            </Link>

                            <Link
                                href="/riwayat"
                                className={`${linkBase} ${isHistoryActive ? linkActive : linkInactive}`}
                            >
                                Riwayat
                            </Link>
                        </nav>
                    </div>

                    <nav className="hidden lg:flex items-center gap-3 shrink-0">

                    <button
                        type="button"
                        className={guideButtonClassName}
                        onClick={() => {
                            setIsDropdownOpen(false);
                            setIsGuideOpen(true);
                        }}
                    >
                        Lihat Panduan
                    </button>

                    {showUserMenu ? (
                        <div ref={dropdownRef} className="relative">
                            <button
                                onClick={() => setIsDropdownOpen((prev) => !prev)}
                                className={actionButtonClassName}
                            >
                                <CircleUserRound size={16} />
                                <span className="max-w-28 truncate">Hi, {session?.user?.name ?? "Pengguna"}</span>
                                <ChevronDown
                                    size={13}
                                    className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                                />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                                    <button
                                        onClick={() => signOut({ callbackUrl: "/" })}
                                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100"
                                    >
                                        <LogOut size={15} />
                                        Keluar
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link
                            href="/"
                            className={loginButtonClassName}
                        >
                            Masuk
                        </Link>
                    )}
                    </nav>

                    <div className="lg:hidden flex items-center gap-2 shrink-0">
                        <button
                            ref={mobileMenuButtonRef}
                            type="button"
                            className={hamburgerButtonClassName}
                            aria-label={isMobileMenuOpen ? "Tutup menu" : "Buka menu"}
                            aria-expanded={isMobileMenuOpen}
                            aria-controls="mobile-menu"
                            onClick={() => {
                                setIsDropdownOpen(false);
                                setIsMobileMenuOpen((prev) => !prev);
                            }}
                        >
                            <span className="sr-only">Menu</span>
                            <span className="relative block h-4 w-4">
                                <span
                                    className={`absolute left-0 right-0 top-0.5 h-0.5 rounded bg-slate-900 transition-transform duration-200 ${
                                        isMobileMenuOpen ? "translate-y-1.5 rotate-45" : ""
                                    }`}
                                />
                                <span
                                    className={`absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 rounded bg-slate-900 transition-opacity duration-200 ${
                                        isMobileMenuOpen ? "opacity-0" : "opacity-100"
                                    }`}
                                />
                                <span
                                    className={`absolute left-0 right-0 bottom-0.5 h-0.5 rounded bg-slate-900 transition-transform duration-200 ${
                                        isMobileMenuOpen ? "-translate-y-1.5 -rotate-45" : ""
                                    }`}
                                />
                            </span>
                        </button>
                    </div>
                </div>

                {isMobileMenuOpen && (
                    <div
                        id="mobile-menu"
                        ref={mobileMenuRef}
                        className="lg:hidden absolute left-0 right-0 top-full z-50 mt-2 w-full rounded-2xl bg-white px-4 sm:px-6 pb-4 ring-1 ring-slate-200 shadow-lg"
                    >
                        <div className="pt-4 pb-3 flex items-center gap-3">
                            <CircleUserRound size={20} className="shrink-0 text-slate-900" />
                            <div className="min-w-0 text-slate-900 text-sm font-semibold truncate">
                                {session?.user ? `Hi, ${session?.user?.name ?? "Pengguna"}` : "Menu"}
                            </div>
                        </div>

                        <div className="border-t border-slate-200" />

                        <div className="pt-3 space-y-1">
                            <Link
                                href="/landingpage"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`${mobileItemBase} ${isHomeActive ? mobileItemActive : mobileItemInactive}`}
                            >
                                Beranda
                            </Link>

                            <Link
                                href="/riwayat"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`${mobileItemBase} ${isHistoryActive ? mobileItemActive : mobileItemInactive}`}
                            >
                                Riwayat
                            </Link>

                            <button
                                type="button"
                                className={`${mobileItemBase} ${mobileItemInactive}`}
                                onClick={() => {
                                    setIsDropdownOpen(false);
                                    setIsMobileMenuOpen(false);
                                    setIsGuideOpen(true);
                                }}
                            >
                                Lihat Panduan
                            </button>

                            {showUserMenu ? (
                                <button
                                    type="button"
                                    className={`${mobileItemBase} text-red-600 hover:bg-red-50`}
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        signOut({ callbackUrl: "/" });
                                    }}
                                >
                                    Keluar
                                </button>
                            ) : (
                                <Link
                                    href="/"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`${mobileItemBase} ${mobileItemInactive}`}
                                >
                                    Masuk
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>

        <PanduanPeminjamanModal open={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
        </>
    );
}
