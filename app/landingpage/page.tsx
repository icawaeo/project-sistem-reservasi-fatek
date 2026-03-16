"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, Calendar, Search, CircleUserRound, X, ChevronDown, ChevronUp, Building2, MapPin, ExternalLink } from "lucide-react";
import { motion, type PanInfo } from "framer-motion";
import { useSession } from "next-auth/react";

type RoomAvailability = {
    room_id: string;
    room_name: string;
    room_building: string;
    room_capacity: number;
    room_locDetail: string;
};

type BuildingGroup = {
    building: string;
    rooms: RoomAvailability[];
};

const occupiedRooms = [
  { name: "Auditorium Dekanat", building: "Gedung Dekanat Fakultas Teknik", time: "06:00 - 22:00 WITA" },
  { name: "Creative Room", building: "Gedung Jurusan Teknik Elektro", time: "09:30 - 21:00 WITA" },
  { name: "Lab Multimedia", building: "Gedung Laboratorium Teknik", time: "07:30 - 11:30 WITA" },
  { name: "JTE - 02", building: "Gedung Jurusan Teknik Elektro", time: "10:00 - 14:00 WITA" },
];

const buildings = [
    { name: "Gedung Dekanat Fakultas Teknik", image: "/images/building/dekanat.jpeg" },
    { name: "Gedung Jurusan Teknik Sipil", image: "/images/building/sipil.jpeg" },
    { name: "Gedung Jurusan Teknik Arsitektur", image: "/images/building/jte.jpeg" },
    { name: "Gedung Jurusan Teknik Elektro", image: "/images/building/jte.jpeg" },
    { name: "Gedung Jurusan Teknik Mesin", image: "/images/building/dekanat.jpeg" },
    { name: "Gedung Laboratorium Fakultas Teknik", image: "/images/building/lab.jpeg" },
];

const mapPoints = [
    {
        name: "Gedung Jurusan Teknik Arsitektur",
        shortUrl: "https://maps.app.goo.gl/8ASpjWXVgejtJDpp8",
        embedUrl: "https://www.google.com/maps?q=1.4594425,124.8258652&z=20&output=embed",
    },
    {
        name: "Gedung Jurusan Teknik Sipil",
        shortUrl: "https://maps.app.goo.gl/Wy4THU5oW6AgfFYp6",
        embedUrl: "https://www.google.com/maps?q=1.4579273,124.8263909&z=20&output=embed",
    },
    {
        name: "Gedung Jurusan Teknik Elektro",
        shortUrl: "https://maps.app.goo.gl/RvMEgxESAGU3VdaBA",
        embedUrl: "https://www.google.com/maps?q=1.4597494,124.8260556&z=20&output=embed",
    },
    {
        name: "Gedung Dekanat Fakultas Teknik",
        shortUrl: "https://maps.app.goo.gl/bhCMCT9FgmDjqsrx9",
        embedUrl: "https://www.google.com/maps?q=1.4590842,124.8255351&z=20&output=embed",
    },
    {
        name: "Gedung Jurusan Teknik Mesin",
        shortUrl: "https://maps.app.goo.gl/wVNVkJSfc59D7PSVA",
        embedUrl: "https://www.google.com/maps?q=1.4585082,124.8256701&z=20&output=embed",
    },
    {
        name: "Gedung Laboratorium Fakultas Teknik",
        shortUrl: "https://maps.app.goo.gl/ucabMNHxz87jdxDP6",
        embedUrl: "https://www.google.com/maps?q=1.4583367,124.8255388&z=20&output=embed",
    },
];

const allMapView = {
    name: "Lihat Semua",
    shortUrl:
        "https://www.google.com/maps/dir/?api=1&origin=1.4594425,124.8258652&destination=1.4583367,124.8255388&travelmode=walking&waypoints=1.4579273,124.8263909|1.4597494,124.8260556|1.4590842,124.8255351|1.4585082,124.8256701",
    embedUrl: "https://www.google.com/maps?q=Fakultas+Teknik+Universitas+Sam+Ratulangi&z=18&output=embed",
};

const TOTAL = buildings.length;
const tripled = [...buildings, ...buildings, ...buildings];

export default function LandingPage() {
    const { data: session } = useSession();
    const [reservationMode, setReservationMode] = useState<"per-day" | "date-range">("per-day");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [validationError, setValidationError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [availableBuildings, setAvailableBuildings] = useState<BuildingGroup[]>([]);
    const [expandedBuildings, setExpandedBuildings] = useState<Record<string, boolean>>({});
    const [selectedRoom, setSelectedRoom] = useState<RoomAvailability | null>(null);
    const [virtualIndex, setVirtualIndex] = useState(TOTAL);
    const [instantSnap, setInstantSnap] = useState(false);
    const [visibleCards, setVisibleCards] = useState(3);
    const [activeMapPoint, setActiveMapPoint] = useState<number | "all">("all");
    const instantSnapRef = useRef(false);

    const activeIndex = ((virtualIndex % TOTAL) + TOTAL) % TOTAL;
    const isAllMapView = activeMapPoint === "all";
    const currentMap = isAllMapView ? allMapView : mapPoints[activeMapPoint];

    useEffect(() => {
        const updateVisibleCards = () => {
            if (window.innerWidth >= 1024) {
                setVisibleCards(3);
                return;
            }
            if (window.innerWidth >= 640) {
                setVisibleCards(2);
                return;
            }
            setVisibleCards(1);
        };

        updateVisibleCards();
        window.addEventListener("resize", updateVisibleCards);
        return () => window.removeEventListener("resize", updateVisibleCards);
    }, []);

    const goToPrevSlide = () => {
        instantSnapRef.current = false;
        setInstantSnap(false);
        setVirtualIndex(v => v - 1);
    };

    const goToNextSlide = () => {
        instantSnapRef.current = false;
        setInstantSnap(false);
        setVirtualIndex(v => v + 1);
    };

    const handleCarouselDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const swipe = info.offset.x;
        const velocity = info.velocity.x;
        if (swipe <= -65 || velocity <= -700) {
            goToNextSlide();
            return;
        }
        if (swipe >= 65 || velocity >= 700) {
            goToPrevSlide();
        }
    };

    const handleAnimComplete = () => {
        if (instantSnapRef.current) {
            instantSnapRef.current = false;
            setInstantSnap(false);
            return;
        }
        setVirtualIndex(current => {
            if (current >= TOTAL * 2 || current < TOTAL) {
                const snapped = ((current % TOTAL) + TOTAL) % TOTAL + TOTAL;
                instantSnapRef.current = true;
                setInstantSnap(true);
                return snapped;
            }
            return current;
        });
    };

    const scheduleLabel =
        reservationMode === "date-range"
            ? `${startDate || "-"} s/d ${endDate || "-"} · ${startTime || "-"} - ${endTime || "-"}`
            : `${startDate || "-"} · ${startTime || "-"} - ${endTime || "-"}`;

    const toggleBuilding = (buildingName: string) => {
        setExpandedBuildings((prev) => ({
            ...prev,
            [buildingName]: !prev[buildingName],
        }));
    };

    const handleRoomSelect = (room: RoomAvailability) => {
        setSelectedRoom(room);
        setIsModalOpen(false);
    };

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
            const params = new URLSearchParams({
                startDate,
                endDate: effectiveEndDate,
                startTime,
                endTime,
            });

            const response = await fetch(`/api/rooms?${params.toString()}`);
            const data = await response.json();

            if (!response.ok) {
                setValidationError(data?.error ?? "Gagal mengambil data ruangan.");
                return;
            }

            const rooms = data as RoomAvailability[];
            const grouped = rooms.reduce<Record<string, RoomAvailability[]>>((acc, room) => {
                if (!acc[room.room_building]) {
                    acc[room.room_building] = [];
                }
                acc[room.room_building].push(room);
                return acc;
            }, {});

            const buildingGroups = Object.entries(grouped).map(([building, groupedRooms]) => ({
                building,
                rooms: groupedRooms,
            }));

            setAvailableBuildings(buildingGroups);
            setExpandedBuildings(
                buildingGroups.reduce<Record<string, boolean>>((acc, group, index) => {
                    acc[group.building] = index === 0;
                    return acc;
                }, {})
            );
            setIsModalOpen(true);
        } catch {
            setValidationError("Terjadi kesalahan saat mencari ruangan.");
        } finally {
            setIsSearching(false);
        }
    };

  return (
    <div className="min-h-screen bg-[#f5f5f0] font-sans">
        <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-5">
            <div>
            <div className="text-white font-bold text-base leading-tight">Fakultas Teknik</div>
            <div className="text-white/80 text-xs leading-tight">Universitas Sam Ratulangi</div>
            </div>
            <nav className="flex items-center gap-6">
            <Link href="/landingpage" className="text-white text-sm font-medium hover:text-white/80 transition-colors">
                Beranda
            </Link>
            <Link href="#" className="text-white/80 text-sm font-medium hover:text-white transition-colors">
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

        <section className="relative h-[62vh] min-h-105">
            <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-slate-700 via-slate-600 to-slate-800" />
            <div className="absolute inset-0 bg-black/40" />
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 pb-12">
            <h1 className="text-white text-3xl md:text-4xl font-black tracking-tight">
                Sistem Reservasi Ruangan
            </h1>
            <p className="text-white/70 mt-2 text-sm max-w-md">
                Cari dan pinjam ruangan untuk kegiatan akademik dan organisasi dengan mudah.
            </p>
            </div>

            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-20 w-full max-w-4xl px-4">
            <div className="bg-white rounded-2xl shadow-2xl px-6 py-6 border border-slate-100">
                <div className="mb-4 flex flex-wrap items-center gap-4">
                <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Reservation Mode</span>
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
                    <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">End Date</label>
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
                    <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Start Time</label>
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
                    <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">End Time</label>
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
                    {isSearching ? "Mencari..." : "Cari Ruangan"}
                    </button>
                </div>
                </div>

                {validationError && (
                <p className="mt-3 text-xs font-medium text-red-600">{validationError}</p>
                )}

                {selectedRoom && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Ruangan Dipilih</p>
                    <div className="mt-1 flex flex-col gap-1 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
                    <p className="font-semibold text-slate-900">{selectedRoom.room_name}</p>
                    <p className="text-xs text-slate-600">
                        {selectedRoom.room_building} · Kapasitas {selectedRoom.room_capacity} Orang
                    </p>
                    </div>
                </div>
                )}
            </div>
            </div>
        </section>

        <section className="mt-64 md:mt-48 px-6 md:px-8 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-slate-900 rounded-full" />
            <h2 className="text-sm font-bold tracking-widest text-slate-900 uppercase">
                Ruangan yang Sedang Digunakan Hari Ini
            </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {occupiedRooms.map((room) => (
                <div key={room.name} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-600 uppercase tracking-wider">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    Sedang Digunakan
                    </span>
                    <div className="h-7 w-7 rounded-lg bg-slate-100 grid place-items-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M3 9h18M9 21V9" />
                    </svg>
                    </div>
                </div>
                <div className="font-bold text-slate-900 text-sm leading-tight">{room.name}</div>
                <div className="text-xs text-slate-500 mt-1 leading-tight">{room.building}</div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock size={12} />
                    {room.time}
                </div>
                </div>
            ))}
            </div>
        </section>

        <section className="mt-16 py-12 bg-[#f5f5f0] overflow-hidden">
            <h2 className="text-center text-sm font-bold tracking-[0.25em] text-slate-900 uppercase mb-8">
                Gedung Yang Tersedia
            </h2>
            
            <div className="relative max-w-5xl mx-auto px-12">
                <button
                onClick={goToPrevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all active:scale-95"
                >
                <ChevronLeft size={20} className="text-slate-700" />
                </button>

                <div className="overflow-hidden">
                <motion.div
                    className="flex px-1 py-2"
                    initial={false}
                    animate={{
                    x: `-${virtualIndex * (100 / visibleCards)}%`
                    }}
                    transition={
                    instantSnap
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 170, damping: 26, mass: 1 }
                    }
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.14}
                    dragMomentum={false}
                    onDragEnd={handleCarouselDragEnd}
                    onAnimationComplete={handleAnimComplete}
                >
                    {tripled.map((building, i) => (
                    <div
                        key={i}
                        className="relative rounded-2xl overflow-hidden h-48 min-w-full sm:min-w-1/2 lg:min-w-1/3 cursor-grab active:cursor-grabbing group shadow-sm shrink-0 px-2 transition-transform duration-300 hover:scale-[1.02]"
                    >
                        <div className="relative h-full rounded-2xl overflow-hidden">
                            <div
                                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                                style={{ backgroundImage: `url(${building.image})` }}
                            />
                            <div className="absolute inset-0 bg-linear-to-b from-black/10 via-black/15 to-black/55" />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/80 via-black/40 to-transparent">
                            <div className="text-white text-[11px] sm:text-xs font-bold leading-snug drop-shadow-md line-clamp-2 mb-2">
                                {building.name}
                            </div>
                            <Link
                                href={`/gedung/${encodeURIComponent(building.name)}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 rounded-full bg-white/20 hover:bg-white/35 border border-white/30 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm transition-all"
                            >
                                Lihat Ruangan <ChevronRight size={10} />
                            </Link>
                            </div>
                        </div>
                    </div>
                    ))}
                </motion.div>
                </div>

                <button
                onClick={goToNextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all active:scale-95"
                >
                <ChevronRight size={20} className="text-slate-700" />
                </button>
            </div>

            <div className="flex justify-center items-center gap-2 mt-5">
                {buildings.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => { instantSnapRef.current = true; setInstantSnap(true); setVirtualIndex(TOTAL + i); }}
                        aria-label={`Go to slide ${i + 1}`}
                        className={`rounded-full transition-all duration-300 h-2 ${
                            activeIndex === i
                                ? "w-6 bg-slate-800"
                                : "w-2 bg-slate-300 hover:bg-slate-500"
                        }`}
                    />
                ))}
            </div>
        </section>

        <section className="py-12 px-8 max-w-5xl mx-auto">
            <h2 className="text-center text-sm font-bold tracking-[0.25em] text-slate-900 uppercase mb-8">
            Lokasi Gedung
            </h2>
            <div className="mb-4 md:mb-5">
                <div className="-mx-2 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:overflow-visible md:px-0">
                <div className="flex w-max min-w-full items-center gap-2 md:mx-auto md:w-full md:max-w-5xl md:min-w-0 md:flex-wrap md:justify-center md:gap-3">
                <button
                    onClick={() => setActiveMapPoint("all")}
                    className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all md:px-4 ${
                        isAllMapView
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                    }`}
                >
                    <MapPin size={13} />
                    {allMapView.name}
                </button>
                {mapPoints.map((point, index) => (
                    <button
                        key={point.name}
                        onClick={() => setActiveMapPoint(index)}
                        className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all md:px-4 ${
                            !isAllMapView && activeMapPoint === index
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                        }`}
                    >
                        <MapPin size={13} />
                        {point.name}
                    </button>
                ))}
                </div>
                </div>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 h-64 sm:h-72 bg-white">
                <iframe
                    key={currentMap.name}
                    src={currentMap.embedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={currentMap.name}
                />
            </div>
            <div className="mt-3 flex justify-center">
                <a
                    href={currentMap.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900"
                >
                    Buka di Google Maps
                    <ExternalLink size={13} />
                </a>
            </div>
        </section>

        <footer className="bg-slate-900 py-5 text-center">
            <p className="text-xs text-slate-400">
            © 2026 FATEK UNSRAT · Website Reservasi Ruangan
            </p>
        </footer>

        {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm md:p-6">
            <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-300 bg-slate-100 shadow-2xl shadow-slate-900/25">
            <div className="flex items-start justify-between border-b border-slate-200 bg-slate-200 px-4 py-4 md:px-6">
                <div>
                <h3 className="text-lg font-black tracking-tight text-slate-800">Daftar Ketersediaan Ruangan</h3>
                <p className="mt-1 text-xs text-slate-600">
                    {scheduleLabel}
                </p>
                </div>
                <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50"
                aria-label="Tutup popup"
                >
                <X size={16} />
                </button>
            </div>

            <div className="max-h-[68vh] overflow-y-auto px-3 py-3 md:px-5 md:py-4">
                {availableBuildings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-600">
                    Tidak ada ruangan tersedia untuk jadwal yang dipilih.
                </div>
                ) : (
                <div className="space-y-3">
                    {availableBuildings.map((group) => {
                    const isExpanded = expandedBuildings[group.building];
                    return (
                        <div key={group.building} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <button
                            onClick={() => toggleBuilding(group.building)}
                            className="flex w-full items-center justify-between bg-slate-100 px-4 py-3 text-left hover:bg-slate-200"
                        >
                            <div className="flex items-center gap-2.5">
                            <Building2 size={16} className="text-orange-500" />
                            <span className="text-xs font-black tracking-[0.2em] text-slate-700 uppercase">
                                {group.building}
                            </span>
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                {group.rooms.length} Ruangan
                            </span>
                            </div>
                            {isExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                        </button>

                        {isExpanded && (
                            <div className="divide-y divide-slate-100">
                            {group.rooms.map((room) => (
                                <div
                                key={room.room_id}
                                className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-xl font-bold text-slate-800">{room.room_name}</p>
                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                        Tersedia
                                    </span>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-600">
                                    Kapasitas: {room.room_capacity} Orang
                                    </p>
                                    <p className="text-xs italic text-slate-500">{room.room_locDetail}</p>
                                </div>

                                <button
                                    onClick={() => handleRoomSelect(room)}
                                    className="h-fit rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
                                >
                                    Pilih Ruangan
                                </button>
                                </div>
                            ))}
                            </div>
                        )}
                        </div>
                    );
                    })}
                </div>
                )}
            </div>
            </div>
        </div>
        )}
    </div>
  );
}