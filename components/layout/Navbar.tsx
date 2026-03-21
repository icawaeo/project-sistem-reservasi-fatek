"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ChevronDown, CircleUserRound, History, LogOut } from "lucide-react";

export default function Navbar() {
    const { data: session } = useSession();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-5">
            <div>
                <div className="text-white font-bold text-base leading-tight">Fakultas Teknik</div>
                <div className="text-white/80 text-xs leading-tight">Universitas Sam Ratulangi</div>
            </div>
            <nav className="flex items-center gap-6">
                <Link
                    href="/landingpage"
                    className="text-white text-sm font-medium hover:text-white/80 transition-colors"
                >
                    Beranda
                </Link>

                {session?.user ? (
                    <div ref={dropdownRef} className="relative">
                        <button
                            onClick={() => setIsDropdownOpen((prev) => !prev)}
                            className="flex items-center gap-2 rounded-full bg-white/20 border border-white/30 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/30 transition-all"
                        >
                            <CircleUserRound size={16} />
                            <span>Hi, {session.user.name ?? "Pengguna"}</span>
                            <ChevronDown
                                size={13}
                                className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                            />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                                <Link
                                    href="/riwayat"
                                    onClick={() => setIsDropdownOpen(false)}
                                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    <History size={15} className="text-slate-500" />
                                    Riwayat Peminjaman
                                </Link>
                                <button
                                    onClick={() => signOut({ callbackUrl: "/auth" })}
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
                        href="/auth?tab=login"
                        className="flex items-center gap-1.5 rounded-full bg-white/20 border border-white/30 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/30 transition-all"
                    >
                        Masuk
                    </Link>
                )}
            </nav>
        </header>
    );
}
