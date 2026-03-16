"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    Calendar,
    Clock,
    Search,
    Users,
    MapPin,
    CircleUserRound,
    Building2,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Home,
} from "lucide-react";
import { useSession } from "next-auth/react";

type RoomWithStatus = {
    room_id: string;
    room_name: string;
    room_building: string;
    room_capacity: number;
    room_locDetail: string;
    room_imageUrl: string | null;
    isCurrentlyOccupied: boolean;
};

const buildingColorMap: Record<string, string> = {
    "Gedung Dekanat Fakultas Teknik": "from-sky-900 to-sky-700",
    "Gedung Jurusan Teknik Sipil": "from-blue-900 to-blue-700",
    "Gedung Jurusan Teknik Arsitektur": "from-slate-800 to-slate-600",
    "Gedung Jurusan Teknik Elektro": "from-green-800 to-green-600",
    "Gedung Jurusan Teknik Mesin": "from-indigo-900 to-indigo-700",
    "Gedung Laboratorium Fakultas Teknik": "from-lime-900 to-lime-700",
};

const mapPoints: Record<string, { shortUrl: string; embedUrl: string }> = {
    "Gedung Jurusan Teknik Arsitektur": {
        shortUrl: "https://maps.app.goo.gl/8ASpjWXVgejtJDpp8",
        embedUrl: "https://www.google.com/maps?q=1.4594425,124.8258652&z=20&output=embed",
    },
    "Gedung Jurusan Teknik Sipil": {
        shortUrl: "https://maps.app.goo.gl/Wy4THU5oW6AgfFYp6",
        embedUrl: "https://www.google.com/maps?q=1.4579273,124.8263909&z=20&output=embed",
    },
    "Gedung Jurusan Teknik Elektro": {
        shortUrl: "https://maps.app.goo.gl/RvMEgxESAGU3VdaBA",
        embedUrl: "https://www.google.com/maps?q=1.4597494,124.8260556&z=20&output=embed",
    },
    "Gedung Dekanat Fakultas Teknik": {
        shortUrl: "https://maps.app.goo.gl/bhCMCT9FgmDjqsrx9",
        embedUrl: "https://www.google.com/maps?q=1.4590842,124.8255351&z=20&output=embed",
    },
    "Gedung Jurusan Teknik Mesin": {
        shortUrl: "https://maps.app.goo.gl/wVNVkJSfc59D7PSVA",
        embedUrl: "https://www.google.com/maps?q=1.4585082,124.8256701&z=20&output=embed",
    },
    "Gedung Laboratorium Fakultas Teknik": {
        shortUrl: "https://maps.app.goo.gl/ucabMNHxz87jdxDP6",
        embedUrl: "https://www.google.com/maps?q=1.4583367,124.8255388&z=20&output=embed",
    },
};

const ROOMS_PER_PAGE = 5;

export default function BuildingPage() {
    const params = useParams();
    const router = useRouter();
    const buildingName = decodeURIComponent(params.building as string);
    const { data: session } = useSession();

    const [rooms, setRooms] = useState<RoomWithStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchScheduleLabel, setSearchScheduleLabel] = useState("");

    // Search form state
    const [reservationMode, setReservationMode] = useState<"per-day" | "date-range">("per-day");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [validationError, setValidationError] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

    const buildingGradient = buildingColorMap[buildingName] ?? "from-slate-700 via-slate-600 to-slate-800";
    const buildingMap = mapPoints[buildingName] ?? null;

    // Load all rooms for this building on mount
    useEffect(() => {
        const loadRooms = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/rooms?building=${encodeURIComponent(buildingName)}`);
                if (res.ok) {
                    const data = await res.json();
                    setRooms(data);
                }
            } finally {
                setIsLoading(false);
            }
        };
        loadRooms();
    }, [buildingName]);

    const handleSearch = async () => {
        setValidationError("");

        if (!startDate || !startTime || !endTime || (reservationMode === "date-range" && !endDate)) {
            setValidationError("Lengkapi tanggal dan waktu reservasi terlebih dahulu.");
            return;
        }

        if (reservationMode === "date-range" && endDate < startDate) {
            setValidationError("End Date harus lebih besar atau sama dengan Start Date.");
            return;
        }

        if (endTime <= startTime) {
            setValidationError("End Time harus lebih besar dari Start Time.");
            return;
        }

        const effectiveEndDate = reservationMode === "date-range" ? endDate : startDate;

        setIsSearching(true);
        try {
            const searchParams = new URLSearchParams({
                startDate,
                endDate: effectiveEndDate,
                startTime,
                endTime,
                building: buildingName,
            });

            const response = await fetch(`/api/rooms?${searchParams.toString()}`);
            const data = await response.json();

            if (!response.ok) {
                setValidationError(data?.error ?? "Gagal mengambil data ruangan.");
                return;
            }

            const roomsWithStatus = (data as Omit<RoomWithStatus, "isCurrentlyOccupied">[]).map((r) => ({
                ...r,
                isCurrentlyOccupied: false,
            }));

            setRooms(roomsWithStatus);
            setHasSearched(true);
            setCurrentPage(1);

            const label =
                reservationMode === "date-range"
                    ? `${startDate} s/d ${effectiveEndDate} · ${startTime} - ${endTime}`
                    : `${startDate} · ${startTime} - ${endTime}`;
            setSearchScheduleLabel(label);
        } catch {
            setValidationError("Terjadi kesalahan saat mencari ruangan.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleReservasi = (room: RoomWithStatus) => {
        if (!session?.user) {
            router.push("/auth?tab=login");
            return;
        }
        if (!hasSearched) {
            setValidationError("Silakan cek ketersediaan terlebih dahulu sebelum melakukan reservasi.");
            return;
        }
        const qp = new URLSearchParams({
            room_id: room.room_id,
            room_name: room.room_name,
            room_building: room.room_building,
            room_capacity: String(room.room_capacity),
            room_locDetail: room.room_locDetail,
            room_imageUrl: room.room_imageUrl ?? "",
            startDate,
            endDate: reservationMode === "date-range" ? endDate : startDate,
            startTime,
            endTime,
        });
        router.push(`/reservasi?${qp.toString()}`);
    };

    const totalPages = Math.ceil(rooms.length / ROOMS_PER_PAGE);
    const paginatedRooms = rooms.slice((currentPage - 1) * ROOMS_PER_PAGE, currentPage * ROOMS_PER_PAGE);

    return (
        <div className="min-h-screen bg-[#f5f5f0] font-sans">
            {/* Header */}
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
                    <Link
                        href="#"
                        className="text-white/80 text-sm font-medium hover:text-white transition-colors"
                    >
                        Riwayat
                    </Link>
                    {session?.user ? (
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 rounded-full bg-white/20 border border-white/30 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/30 transition-all"
                        >
                            <CircleUserRound size={16} />
                            <span>Hi, {session.user.name ?? "Pengguna"}</span>
                        </Link>
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

            {/* Hero Section */}
            <section className="relative h-[62vh] min-h-105">
                <div className="absolute inset-0 overflow-hidden">
                    <div className={`absolute inset-0 bg-linear-to-br ${buildingGradient}`} />
                    <div className="absolute inset-0 bg-black/40" />
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 pb-12">
                    <h1 className="text-white text-3xl md:text-4xl font-black tracking-tight">
                        {buildingName}
                    </h1>
                    <p className="text-white/70 mt-2 text-sm max-w-md">
                        Cek ketersediaan dan reservasi ruangan di gedung ini.
                    </p>
                </div>

                {/* Search Widget */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-20 w-full max-w-4xl px-4">
                    <div className="bg-white rounded-2xl shadow-2xl px-6 py-6 border border-slate-100">
                        <div className="mb-4 flex flex-wrap items-center gap-4">
                            <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                Reservation Mode
                            </span>
                            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    type="radio"
                                    name="reservation-mode"
                                    value="per-day"
                                    checked={reservationMode === "per-day"}
                                    onChange={() => {
                                        setReservationMode("per-day");
                                        setEndDate("");
                                        setValidationError("");
                                    }}
                                    className="h-4 w-4 accent-slate-900"
                                />
                                Per Day
                            </label>
                            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    type="radio"
                                    name="reservation-mode"
                                    value="date-range"
                                    checked={reservationMode === "date-range"}
                                    onChange={() => {
                                        setReservationMode("date-range");
                                        setValidationError("");
                                    }}
                                    className="h-4 w-4 accent-slate-900"
                                />
                                Date Range
                            </label>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-end gap-4">
                            <div className="flex-1 min-w-0">
                                <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                    {reservationMode === "per-day" ? "Date" : "Start Date"}
                                </label>
                                <div className="mt-1 flex items-center gap-2 border-b border-slate-200 pb-1">
                                    <Calendar size={14} className="text-slate-400 shrink-0" />
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => {
                                            setStartDate(e.target.value);
                                            setValidationError("");
                                        }}
                                        className="text-sm text-slate-600 outline-none w-full bg-transparent appearance-none cursor-pointer min-w-0"
                                    />
                                </div>
                            </div>

                            {reservationMode === "date-range" && (
                                <div className="flex-1 min-w-0">
                                    <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                        End Date
                                    </label>
                                    <div className="mt-1 flex items-center gap-2 border-b border-slate-200 pb-1">
                                        <Calendar size={14} className="text-slate-400 shrink-0" />
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => {
                                                setEndDate(e.target.value);
                                                setValidationError("");
                                            }}
                                            className="text-sm text-slate-600 outline-none w-full bg-transparent appearance-none cursor-pointer min-w-0"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                    Start Time
                                </label>
                                <div className="mt-1 flex items-center gap-2 border-b border-slate-200 pb-1">
                                    <Clock size={14} className="text-slate-400 shrink-0" />
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => {
                                            setStartTime(e.target.value);
                                            setValidationError("");
                                        }}
                                        className="text-sm text-slate-600 outline-none w-full bg-transparent appearance-none cursor-pointer min-w-0"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                    End Time
                                </label>
                                <div className="mt-1 flex items-center gap-2 border-b border-slate-200 pb-1">
                                    <Clock size={14} className="text-slate-400 shrink-0" />
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => {
                                            setEndTime(e.target.value);
                                            setValidationError("");
                                        }}
                                        className="text-sm text-slate-600 outline-none w-full bg-transparent appearance-none cursor-pointer min-w-0"
                                    />
                                </div>
                            </div>

                            <div className="shrink-0 md:self-end">
                                <button
                                    onClick={handleSearch}
                                    disabled={isSearching}
                                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white rounded-xl px-6 py-3 text-sm font-semibold hover:bg-slate-700 transition-all shadow-lg shadow-slate-900/20 whitespace-nowrap disabled:cursor-not-allowed disabled:bg-slate-500"
                                >
                                    <Search size={15} />
                                    {isSearching ? "Mencari..." : "Cek Ketersediaan"}
                                </button>
                            </div>
                        </div>

                        {validationError && (
                            <p className="mt-3 text-xs font-medium text-red-600">{validationError}</p>
                        )}
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <div className="mt-64 md:mt-48 px-6 md:px-8 max-w-5xl mx-auto">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-6">
                    <Link
                        href="/landingpage"
                        className="hover:text-slate-800 flex items-center gap-1 transition-colors"
                    >
                        <Home size={12} />
                        Gedung
                    </Link>
                    <ChevronRight size={12} />
                    <span className="text-slate-800 font-medium">{buildingName}</span>
                </nav>

                {/* Section Header */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div className="w-1 h-6 bg-slate-900 rounded-full" />
                    <h2 className="text-sm font-bold tracking-widest text-slate-900 uppercase">
                        Daftar Ruangan
                    </h2>
                    {hasSearched && searchScheduleLabel && (
                        <span className="text-[11px] text-slate-500 font-medium bg-slate-100 rounded-full px-3 py-0.5">
                            {searchScheduleLabel}
                        </span>
                    )}
                    {hasSearched && (
                        <button
                            onClick={async () => {
                                setHasSearched(false);
                                setSearchScheduleLabel("");
                                setCurrentPage(1);
                                setIsLoading(true);
                                try {
                                    const res = await fetch(
                                        `/api/rooms?building=${encodeURIComponent(buildingName)}`
                                    );
                                    if (res.ok) setRooms(await res.json());
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                            className="ml-auto text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline underline-offset-2 transition-colors"
                        >
                            Reset
                        </button>
                    )}
                </div>

                {/* Room List */}
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 animate-pulse flex gap-4"
                            >
                                <div className="w-24 h-24 rounded-xl bg-slate-200 shrink-0" />
                                <div className="flex-1 space-y-3 py-1">
                                    <div className="h-5 bg-slate-200 rounded w-1/2" />
                                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                                    <div className="h-3 bg-slate-200 rounded w-1/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : rooms.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center">
                        <Building2 size={32} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm font-medium text-slate-600">
                            {hasSearched
                                ? "Tidak ada ruangan tersedia untuk jadwal yang dipilih."
                                : "Tidak ada ruangan ditemukan untuk gedung ini."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {paginatedRooms.map((room) => (
                            <div
                                key={room.room_id}
                                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col sm:flex-row"
                            >
                                {/* Image / placeholder */}
                                <div className="sm:w-36 w-full h-32 sm:h-auto bg-slate-100 shrink-0 flex items-center justify-center">
                                    {room.room_imageUrl ? (
                                        <img
                                            src={room.room_imageUrl}
                                            alt={room.room_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <svg
                                            width="28"
                                            height="28"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            className="text-slate-300"
                                        >
                                            <rect x="3" y="3" width="18" height="18" rx="2" />
                                            <path d="M3 9h18M9 21V9" />
                                        </svg>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex flex-1 flex-col sm:flex-row sm:items-center p-4 gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                            <h3 className="text-lg font-bold text-slate-900 leading-tight">
                                                {room.room_name}
                                            </h3>
                                            {room.isCurrentlyOccupied ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-600 uppercase tracking-wider">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                                                    Sedang Digunakan
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                                    Tersedia
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                                            <MapPin size={11} className="shrink-0" />
                                            <span className="truncate">{room.room_building}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                                            <Users size={11} className="shrink-0" />
                                            <span>Kapasitas: {room.room_capacity} Orang</span>
                                        </div>
                                        {room.room_locDetail && (
                                            <p className="text-xs italic text-slate-400 mt-0.5 truncate">
                                                {room.room_locDetail}
                                            </p>
                                        )}
                                    </div>

                                    {/* Action button */}
                                    <div className="shrink-0">
                                        <button
                                            onClick={() => handleReservasi(room)}
                                            disabled={room.isCurrentlyOccupied}
                                            className="w-full sm:w-auto rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-colors uppercase tracking-wide disabled:bg-slate-300 disabled:cursor-not-allowed"
                                        >
                                            Pilih Ruangan
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="h-9 w-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft size={15} />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`h-9 w-9 rounded-lg border text-sm font-semibold transition-all ${
                                    currentPage === page
                                        ? "border-slate-900 bg-slate-900 text-white"
                                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="h-9 w-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight size={15} />
                        </button>
                    </div>
                )}
            </div>

            {/* Map Section */}
            {buildingMap && (
                <section className="mt-16 py-12 px-6 md:px-8 max-w-5xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-6 bg-slate-900 rounded-full" />
                        <h2 className="text-sm font-bold tracking-widest text-slate-900 uppercase">
                            Lokasi Gedung
                        </h2>
                    </div>
                    <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 h-64 sm:h-72 bg-white">
                        <iframe
                            src={buildingMap.embedUrl}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title={buildingName}
                        />
                    </div>
                    <div className="mt-3 flex justify-center">
                        <a
                            href={buildingMap.shortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                        >
                            Buka di Google Maps
                            <ExternalLink size={13} />
                        </a>
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="bg-slate-900 py-5 text-center mt-12">
                <p className="text-xs text-slate-400">© 2026 FATEK UNSRAT · Website Reservasi Ruangan</p>
            </footer>
        </div>
    );
}
