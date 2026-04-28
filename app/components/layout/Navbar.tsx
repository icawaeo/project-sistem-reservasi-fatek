"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ChevronDown, CircleUserRound, LogOut } from "lucide-react";

const SCROLL_PIN_THRESHOLD = 12;

export default function Navbar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const isPrivilegedStaff = session?.user?.userType === "STAFF";
    const showUserMenu = Boolean(session?.user) && !isPrivilegedStaff;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
        ? "mx-auto flex w-full items-center justify-between border-b border-slate-200 bg-white px-6 py-3 text-slate-900 shadow-md backdrop-blur-xl backdrop-saturate-150"
        : "flex w-full items-center justify-between rounded-full bg-white px-8 py-3 text-slate-900 backdrop-blur-xl ring-1 ring-slate-200 shadow-lg";

    const brandTitleClassName = "text-slate-900 font-bold text-sm leading-tight";
    const brandSubtitleClassName = "text-slate-700 text-[11px] leading-tight";

    const actionButtonClassName = "flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-all";

    const loginButtonClassName = "flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-6 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-all";

    return (
        <header
            className={`${headerClassName} transition-[top,width,transform] duration-300 ease-out`}
            style={{ top: headerTopOffset }}
        >
            <div className={`${surfaceClassName} transition-all duration-300 ease-out`}>
                <div className="flex items-center gap-3 shrink-0">
                    <Link href="/landingpage" aria-label="Ke halaman beranda">
                        <Image
                            src="/images/Logo_Fatek_Unsrat.png"
                            alt="Logo Fakultas Teknik Unsrat"
                            width={36}
                            height={36}
                            className="h-9 w-9 object-contain"
                            priority
                        />
                    </Link>
                    <div className="min-w-0">
                        <div className={brandTitleClassName}>Fakultas Teknik</div>
                        <div className={brandSubtitleClassName}>Universitas Sam Ratulangi</div>
                    </div>
                </div>

                <div className="flex-1 flex justify-center px-4">
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

                <nav className="flex items-center gap-6 shrink-0">

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
                                {/* <Link
                                    href="/riwayat"
                                    onClick={() => setIsDropdownOpen(false)}
                                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    <History size={15} className="text-slate-500" />
                                    Riwayat Peminjaman
                                </Link> */}
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
            </div>
        </header>
    );
}
