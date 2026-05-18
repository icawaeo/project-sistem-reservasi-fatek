"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    Users,
    MapPin,
    Building2,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Home,
} from "lucide-react";
import Navbar from "@/app/components/layout/NavbarClient";
import ReservationSearchWidget, { type ReservationMode } from "@/app/components/user/ReservationSearchWidget";
import { useSession } from "next-auth/react";
import { useToast } from "@/app/components/ui/toast";
import {
    DEFAULT_MIN_DAYS_AHEAD_EXCLUSIVE,
    validateReservationLeadTimeYMD,
} from "@/lib/reservation-policy";
import { validateBuildingOperationalWindow } from "@/lib/building-operational-policy";
import type { LabDepartmentValue, LabProgramValue } from "@/app/components/administrator/kelola-ruangan/room-types";

type RoomWithStatus = {
    room_id: string;
    room_name: string;
    room_building: string;
    room_capacity: number;
    room_locDetail: string;
    room_imageUrl: string | null;
    isCurrentlyOccupied: boolean;
    labProgram: LabProgramValue | null;
    labDepartment: LabDepartmentValue | null;
};

import { getBuildingDefaultImage, isLabBuilding, getBuildingGradient } from "@/app/utils/building";

const LAB_PROGRAM_LABELS: Record<LabProgramValue, string> = {
    IT: "Informatika",
    ELEKTRO: "Teknik Elektro",
    ARSITEKTUR: "Arsitektur",
    PWK: "PWK",
    SIPIL: "Teknik Sipil",
    LINGKUNGAN: "Teknik Lingkungan",
    MESIN: "Teknik Mesin",
};

const LAB_DEPARTMENT_LABELS: Record<LabDepartmentValue, string> = {
    ELEKTRO: "Teknik Elektro",
    ARSITEKTUR: "Arsitektur",
    SIPIL: "Teknik Sipil",
    MESIN: "Teknik Mesin",
};

const LAB_DEPARTMENT_OPTIONS: LabDepartmentValue[] = ["ELEKTRO", "ARSITEKTUR", "SIPIL", "MESIN"];
const LAB_PROGRAM_OPTIONS: LabProgramValue[] = ["IT", "ELEKTRO", "ARSITEKTUR", "PWK", "SIPIL", "LINGKUNGAN", "MESIN"];

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

const ROOMS_PER_PAGE = 10;

export default function BuildingPage() {
    const params = useParams();
    const router = useRouter();
    const buildingName = decodeURIComponent(params.building as string);
    const { data: session, status: sessionStatus } = useSession();
    const isPrivilegedStaff = sessionStatus === "authenticated" && session?.user?.userType === "STAFF";
    const { pushToast } = useToast();

    const [rooms, setRooms] = useState<RoomWithStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchScheduleLabel, setSearchScheduleLabel] = useState("");
    const [selectedLabDepartment, setSelectedLabDepartment] = useState<"" | LabDepartmentValue>("");
    const [selectedLabProgram, setSelectedLabProgram] = useState<"" | LabProgramValue>("");

    const [buildingInfo, setBuildingInfo] = useState<{ 
        building_imageUrl: string | null;
        operational_days: string[];
        open_time: string;
        close_time: string;
    } | null>(null);

    // Search form state
    const [reservationMode, setReservationMode] = useState<ReservationMode>("per-day");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [minDaysAheadExclusive, setMinDaysAheadExclusive] = useState(DEFAULT_MIN_DAYS_AHEAD_EXCLUSIVE);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

    const buildingGradient = getBuildingGradient(buildingName);
    const buildingHeroImage = buildingInfo?.building_imageUrl || getBuildingDefaultImage(buildingName) || "/hero.jpeg";
    const buildingMap = mapPoints[buildingName] ?? null;
    const isLabBuildingFlag = isLabBuilding(buildingName);

    const filteredRooms = useMemo(() => {
        return rooms.filter((room) => {
            if (!isLabBuildingFlag) return true;

            if (selectedLabDepartment && room.labDepartment !== selectedLabDepartment) {
                return false;
            }

            if (selectedLabProgram && room.labProgram !== selectedLabProgram) {
                return false;
            }

            return true;
        });
    }, [isLabBuildingFlag, rooms, selectedLabDepartment, selectedLabProgram]);

    const totalPages = Math.max(1, Math.ceil(filteredRooms.length / ROOMS_PER_PAGE));
    const paginatedRooms = filteredRooms.slice((currentPage - 1) * ROOMS_PER_PAGE, currentPage * ROOMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage((page) => Math.min(page, totalPages));
    }, [totalPages]);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedLabDepartment, selectedLabProgram]);

    // Load building info
    useEffect(() => {
        const loadBuilding = async () => {
            try {
                const res = await fetch(`/api/buildings?name=${encodeURIComponent(buildingName)}`, {
                    cache: "no-store",
                });
                if (res.ok) {
                    const data = await res.json();
                    setBuildingInfo(data);
                }
            } catch (err) {
                console.error("Failed to load building info", err);
            }
        };
        loadBuilding();
    }, [buildingName]);

    useEffect(() => {
        const loadPolicy = async () => {
            try {
                const response = await fetch("/api/reservation-policy", { cache: "no-store" });
                if (!response.ok) return;
                const payload = await response.json();
                if (Number.isInteger(payload?.minDaysAheadExclusive)) {
                    setMinDaysAheadExclusive(payload.minDaysAheadExclusive);
                }
            } catch {
                // Gunakan default lokal jika aturan gagal dimuat.
            }
        };

        void loadPolicy();
    }, []);

    // Load all rooms for this building on mount
    useEffect(() => {
        const loadRooms = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/rooms?building=${encodeURIComponent(buildingName)}`, {
                    cache: "no-store",
                });
                const payload = (await res.json().catch(() => null)) as unknown;

                if (!res.ok) {
                    const message =
                        payload && typeof payload === "object" && "error" in payload
                            ? String((payload as { error?: unknown }).error ?? "")
                            : "";
                    pushToast({
                        type: "error",
                        message: message.trim() || "Gagal memuat data ruangan.",
                    });
                    setRooms([]);
                    return;
                }

                setRooms(payload as RoomWithStatus[]);
            } catch {
                pushToast({ type: "error", message: "Terjadi kesalahan saat memuat data ruangan." });
                setRooms([]);
            } finally {
                setIsLoading(false);
            }
        };
        loadRooms();
    }, [buildingName, pushToast]);

    useEffect(() => {
        const refreshRooms = async () => {
            try {
                const res = await fetch(`/api/rooms?building=${encodeURIComponent(buildingName)}`, {
                    cache: "no-store",
                });
                if (!res.ok) return;

                const payload = (await res.json()) as RoomWithStatus[];
                setRooms(payload);
            } catch {
                // Biarkan data terakhir tetap tampil jika refresh ringan gagal.
            }
        };

        const handleFocus = () => {
            void refreshRooms();
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                void refreshRooms();
            }
        };

        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [buildingName]);

    const handleSearch = async () => {
        if (!startDate || !startTime || !endTime || (reservationMode === "date-range" && !endDate)) {
            pushToast({ type: "error", message: "Lengkapi tanggal dan waktu reservasi terlebih dahulu." });
            return;
        }

        const leadTimeCheck = validateReservationLeadTimeYMD(startDate, { minDaysAheadExclusive });
        if (!leadTimeCheck.ok) {
            pushToast({
                type: "error",
                message: `Reservasi hanya dapat dilakukan minimal H-${minDaysAheadExclusive}. Silakan pilih tanggal mulai ${leadTimeCheck.earliestAllowedDateYMD}.`,
            });
            return;
        }

        if (reservationMode === "date-range" && endDate < startDate) {
            pushToast({ type: "error", message: "End Date harus lebih besar atau sama dengan Start Date." });
            return;
        }

        if (endTime <= startTime) {
            pushToast({ type: "error", message: "Jam selesai tidak boleh lebih awal dari jam mulai." });
            return;
        }

        const effectiveEndDate = reservationMode === "date-range" ? endDate : startDate;

        if (buildingInfo) {
            const operationalCheck = validateBuildingOperationalWindow({
                startDate,
                endDate: effectiveEndDate,
                startTime,
                endTime,
                schedule: buildingInfo,
            });

            if (!operationalCheck.ok) {
                pushToast({
                    type: "error",
                    message: operationalCheck.error,
                });
                return;
            }
        }

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
                pushToast({ type: "error", message: data?.error ?? "Gagal mengambil data ruangan." });
                return;
            }

            const roomsWithStatus = (data as Omit<RoomWithStatus, "isCurrentlyOccupied">[]).map((r) => ({
                ...r,
                isCurrentlyOccupied: false,
            }));

            setRooms(roomsWithStatus);
            setSelectedLabDepartment("");
            setSelectedLabProgram("");
            setHasSearched(true);
            setCurrentPage(1);

            const label =
                reservationMode === "date-range"
                    ? `${startDate} s/d ${effectiveEndDate} · ${startTime} - ${endTime}`
                    : `${startDate} · ${startTime} - ${endTime}`;
            setSearchScheduleLabel(label);
        } catch {
            pushToast({ type: "error", message: "Terjadi kesalahan saat mencari ruangan." });
        } finally {
            setIsSearching(false);
        }
    };

    const handleReservasi = async (room: RoomWithStatus) => {
        if (sessionStatus === "loading") {
            return;
        }

        if (sessionStatus !== "authenticated" || isPrivilegedStaff) {
            router.push("/?tab=login");
            return;
        }

        if (!hasSearched) {
            pushToast({
                type: "error",
                message: "Silakan lengkapi form dan cek ketersediaan terlebih dahulu sebelum melakukan reservasi.",
            });
            document.getElementById("search-widget")?.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }

        try {
            const activeRes = await fetch("/api/reservasi/active");
            const activeData = await activeRes.json();
            if (activeData.hasActive) {
                pushToast({ type: "error", message: "Anda masih memiliki pengajuan reservasi aktif yang belum selesai." });
                return;
            }
        } catch (e) {
            // Lanjutkan jika terjadi error saat mengecek
        }

        const effectiveEndDate = reservationMode === "date-range" ? endDate : startDate;

        try {
            sessionStorage.setItem(
                "reservationDraft",
                JSON.stringify({
                    room_id: room.room_id,
                    room_name: room.room_name,
                    room_building: room.room_building,
                    room_capacity: String(room.room_capacity),
                    room_locDetail: room.room_locDetail,
                    room_imageUrl: room.room_imageUrl ?? "",
                    startDate,
                    endDate: effectiveEndDate,
                    startTime,
                    endTime,
                }),
            );
        } catch {
            // ignore (e.g. storage quota)
        }

        const qp = new URLSearchParams({
            room_id: room.room_id,
            room_name: room.room_name,
            room_building: room.room_building,
            room_capacity: String(room.room_capacity),
            room_locDetail: room.room_locDetail,
            room_imageUrl: room.room_imageUrl ?? "",
            startDate,
            endDate: effectiveEndDate,
            startTime,
            endTime,
        });

        router.push(`/reservasi?${qp.toString()}`);
    };

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* Navbar */}
            <Navbar />

            {/* Hero Section */}
            <section className="relative h-[62vh] min-h-105">
                <div className="absolute inset-0 overflow-hidden">
                    <div className={`absolute inset-0 bg-linear-to-br ${buildingGradient}`} />
                    <Image
                        src={buildingHeroImage}
                        alt={buildingName}
                        fill
                        sizes="100vw"
                        className="object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-linear-to-b from-black/85 via-black/65 to-black/85 backdrop-blur-sm" />
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 pb-12">
                    <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-black tracking-tight">
                        {buildingName}
                    </h1>
                    {buildingInfo ? (
                        <div className="mt-6 w-full max-w-[90vw] sm:max-w-sm md:max-w-md text-white/90 text-sm md:text-base font-medium tracking-wide bg-black/20 px-6 py-4 rounded-3xl backdrop-blur-md border border-white/10 mx-auto">
                            <p className="text-[11px] md:text-xs text-white/70 uppercase tracking-widest font-bold mb-1.5">
                                Waktu Operasional
                            </p>
                            <p>
                                {buildingInfo.operational_days.join(", ")}
                            </p>
                            <p className="mt-0.5">
                                {buildingInfo.open_time} - {buildingInfo.close_time} WITA
                            </p>
                        </div>
                    ) : (
                        <div className="mt-6 h-24 w-full max-w-[90vw] sm:max-w-sm md:max-w-md animate-pulse bg-white/10 rounded-3xl mx-auto" />
                    )}
                </div>

                {/* Search Widget */}
                <div id="search-widget" className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-20 w-full max-w-4xl px-4">
                    <ReservationSearchWidget
                        reservationMode={reservationMode}
                        onReservationModeChange={(mode) => {
                            setReservationMode(mode);
                            if (mode === "per-day") {
                                setEndDate("");
                            }
                        }}
                        startDate={startDate}
                        onStartDateChange={setStartDate}
                        endDate={endDate}
                        onEndDateChange={setEndDate}
                        startTime={startTime}
                        onStartTimeChange={setStartTime}
                        endTime={endTime}
                        onEndTimeChange={setEndTime}
                        onSearch={handleSearch}
                        isSearching={isSearching}
                        searchLabelIdle="Cek Ketersediaan"
                        searchLabelLoading="Mencari..."
                    />
                </div>
            </section>

            {/* Main Content */}
            <div className="mt-64 md:mt-48 px-6 md:px-8 max-w-5xl mx-auto">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-[11px] lg:text-xs text-slate-500 mb-6">
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
                    <h2 className="text-sm lg:text-base font-bold tracking-widest text-slate-900 uppercase">
                        Daftar Ruangan
                    </h2>
                    {hasSearched && searchScheduleLabel && (
                        <span className="text-[11px] lg:text-xs text-slate-500 font-medium bg-slate-100 rounded-full px-3 py-0.5">
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
                                    const payload = (await res.json().catch(() => null)) as unknown;

                                    if (!res.ok) {
                                        const message =
                                            payload && typeof payload === "object" && "error" in payload
                                                ? String((payload as { error?: unknown }).error ?? "")
                                                : "";
                                        pushToast({
                                            type: "error",
                                            message: message.trim() || "Gagal memuat data ruangan.",
                                        });
                                        setRooms([]);
                                        return;
                                    }

                                    setRooms(payload as RoomWithStatus[]);
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                            className="ml-auto text-[11px] lg:text-xs font-semibold text-slate-500 hover:text-slate-800 underline underline-offset-2 transition-colors"
                        >
                            Reset
                        </button>
                    )}
                </div>

                {isLabBuildingFlag ? (
                    <div className="mb-6 flex w-full items-center gap-2 overflow-x-auto pb-1 no-scrollbar sm:w-auto sm:justify-start">
                        <label className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs md:text-sm lg:text-base text-slate-700">
                            <span className="whitespace-nowrap font-semibold">Filter Jurusan</span>
                            <select
                                value={selectedLabDepartment}
                                onChange={(event) => {
                                    const nextDepartment = event.target.value as "" | LabDepartmentValue;
                                    setSelectedLabDepartment(nextDepartment);
                                    setSelectedLabProgram("");
                                }}
                                className="bg-transparent text-xs md:text-sm lg:text-base font-semibold outline-none"
                            >
                                <option value="">Semua Jurusan</option>
                                {LAB_DEPARTMENT_OPTIONS.map((department) => (
                                    <option key={department} value={department}>
                                        {LAB_DEPARTMENT_LABELS[department]}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs md:text-sm lg:text-base text-slate-700">
                            <span className="whitespace-nowrap font-semibold">Filter Prodi</span>
                            <select
                                value={selectedLabProgram}
                                onChange={(event) => setSelectedLabProgram(event.target.value as "" | LabProgramValue)}
                                className="bg-transparent text-xs md:text-sm lg:text-base font-semibold outline-none"
                            >
                                <option value="">Semua Prodi</option>
                                {LAB_PROGRAM_OPTIONS.map((program) => (
                                    <option key={program} value={program}>
                                        {LAB_PROGRAM_LABELS[program]}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                ) : null}

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
                        <p className="text-sm lg:text-base font-medium text-slate-600">
                            {hasSearched
                                ? "Tidak ada ruangan tersedia untuk jadwal yang dipilih."
                                : "Tidak ada ruangan ditemukan untuk gedung ini."}
                        </p>
                    </div>
                ) : paginatedRooms.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center">
                        <Building2 size={32} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm lg:text-base font-medium text-slate-600">
                            Tidak ada data.
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
                                <div className="relative sm:w-36 w-full h-32 sm:h-auto bg-slate-100 shrink-0 flex items-center justify-center overflow-hidden">
                                    {room.room_imageUrl ? (
                                        <Image
                                            src={room.room_imageUrl}
                                            alt={room.room_name}
                                            fill
                                            sizes="(max-width: 640px) 100vw, 144px"
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
                                            <h3 className="text-lg lg:text-xl font-bold text-slate-900 leading-tight">
                                                {room.room_name}
                                            </h3>
                                            {room.isCurrentlyOccupied ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] lg:text-[11px] font-bold text-red-600 uppercase tracking-wider">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                                                    Sedang Digunakan
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] lg:text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                                                    Tersedia
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs lg:text-sm text-slate-500 mb-1">
                                            <MapPin size={11} className="shrink-0" />
                                            <span className="truncate">{room.room_building}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs lg:text-sm text-slate-500 mb-1">
                                            <Users size={11} className="shrink-0" />
                                            <span>Kapasitas: {room.room_capacity} Orang</span>
                                        </div>
                                        {isLabBuildingFlag && room.labProgram && room.labDepartment ? (
                                            <div className="flex items-center gap-1.5 text-[11px] lg:text-sm text-slate-500 mb-1">
                                                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                                                    Program Studi: {LAB_PROGRAM_LABELS[room.labProgram]}
                                                </span>
                                                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                                                    Jurusan: {LAB_DEPARTMENT_LABELS[room.labDepartment]}
                                                </span>
                                            </div>
                                        ) : null}
                                        {room.room_locDetail && (
                                            <p className="text-xs lg:text-sm italic text-slate-400 mt-0.5 truncate">
                                                {room.room_locDetail}
                                            </p>
                                        )}
                                    </div>

                                    {/* Action button */}
                                    <div className="shrink-0">
                                        <button
                                            onClick={() => handleReservasi(room)}
                                            disabled={room.isCurrentlyOccupied}
                                            className="w-full sm:w-auto rounded-xl bg-slate-900 px-5 py-2.5 text-sm lg:text-base font-semibold text-white hover:bg-slate-700 transition-colors uppercase tracking-wide disabled:bg-slate-300 disabled:cursor-not-allowed"
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
                                className={`h-9 w-9 rounded-lg border text-sm lg:text-base font-semibold transition-all ${
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
                        <h2 className="text-sm lg:text-base font-bold tracking-widest text-slate-900 uppercase">
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
                            className="inline-flex items-center gap-1.5 text-xs lg:text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                        >
                            Buka di Google Maps
                            <ExternalLink size={13} />
                        </a>
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="bg-slate-900 py-5 text-center mt-12">
                <p className="text-xs lg:text-sm text-slate-400">© 2026 FATEK UNSRAT · Website Reservasi Ruangan</p>
            </footer>
        </div>
    );
}
