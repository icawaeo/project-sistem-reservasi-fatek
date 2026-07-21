"use client";

import { Suspense, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    Building2,
    Calendar,
    Clock,
    FileText,
    Home,
    Info,
    Mail,
    MapPin,
    Phone,
    Upload,
    Users,
} from "lucide-react";
import Navbar from "@/app/components/layout/NavbarClient";
import { useToast } from "@/app/components/ui/toast";

import { isLabBuilding as isLabBuildingUtil, getBuildingGradient } from "@/app/utils/building";
import { isPublicReservationUser } from "@/lib/role-access";

type ReservationFlow = "GENERAL" | "LAB_SKRIPSI" | "LAB_LAINNYA";

type ReservationDraft = {
    room_id?: string;
    room_name?: string;
    room_building?: string;
    room_capacity?: string;
    room_locDetail?: string;
    room_imageUrl?: string;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    name?: string;
    identifier?: string;
    email?: string;
    phone?: string;
    purpose?: string;
    reason?: string;
    res_flow?: ReservationFlow;
    activityType?: "AKADEMIK" | "NON_AKADEMIK";
    documentName?: string;
    documentSize?: number | null;
    documentType?: string | null;
    documentDataUrl?: string | null;
};

function useSessionStorageItem(key: string) {
    return useSyncExternalStore(
        (onStoreChange) => {
            if (typeof window === "undefined") return () => {};

            const handler = () => onStoreChange();
            window.addEventListener("storage", handler);

            // Ensure a re-check after hydration even if nothing triggers a storage event.
            Promise.resolve().then(onStoreChange);

            return () => {
                window.removeEventListener("storage", handler);
            };
        },
        () => (typeof window === "undefined" ? null : sessionStorage.getItem(key)),
        () => null,
    );
}

function ReservasiContent() {
    const { data: session } = useSession();
    const publicSessionUser = isPublicReservationUser(session?.user) ? session?.user : null;
    const router = useRouter();
    const searchParams = useSearchParams();
    const { pushToast } = useToast();

    const rawDraft = useSessionStorageItem("reservationDraft");
    const storedDraft = useMemo(() => {
        if (!rawDraft) return null;
        try {
            return JSON.parse(rawDraft) as ReservationDraft;
        } catch {
            return null;
        }
    }, [rawDraft]);

    const roomId = searchParams.get("room_id") ?? storedDraft?.room_id ?? "";
    const roomName = searchParams.get("room_name") ?? storedDraft?.room_name ?? "Ruangan";
    const roomBuilding = searchParams.get("room_building") ?? storedDraft?.room_building ?? "Gedung tidak diketahui";
    const roomCapacity = searchParams.get("room_capacity") ?? storedDraft?.room_capacity ?? "-";
    const roomLocDetail = searchParams.get("room_locDetail") ?? storedDraft?.room_locDetail ?? "";
    const roomImageUrl = searchParams.get("room_imageUrl") ?? storedDraft?.room_imageUrl ?? "";

    const startDate = searchParams.get("startDate") ?? storedDraft?.startDate ?? "";
    const endDate = searchParams.get("endDate") ?? storedDraft?.endDate ?? startDate;
    const startTime = searchParams.get("startTime") ?? storedDraft?.startTime ?? "";
    const endTime = searchParams.get("endTime") ?? storedDraft?.endTime ?? "";

    const isCivitas = Boolean(publicSessionUser);
    const isLabBuilding = isLabBuildingUtil(roomBuilding);
    const profileIdentifierValue = isCivitas ? publicSessionUser?.identifier?.trim() ?? "" : "";
    const canEditIdentifier = isCivitas && !profileIdentifierValue;

    const [borrowerName] = useState<string | null>(null);
    const [identifier, setIdentifier] = useState<string | null>(null);
    const [email] = useState<string | null>(null);
    const [phone, setPhone] = useState<string | null>(null);
    const [purposeTitle, setPurposeTitle] = useState<string | null>(null);
    const [purposeDetail, setPurposeDetail] = useState<string | null>(null);
    const [reservationFlow, setReservationFlow] = useState<ReservationFlow | null>(null);
    const [activityType, setActivityType] = useState<"AKADEMIK" | "NON_AKADEMIK" | null>(null);
    const [supportingFile, setSupportingFile] = useState<File | null>(null);
    const [supportingFileDataUrl, setSupportingFileDataUrl] = useState<string | null>(null);
    const [availabilityError, setAvailabilityError] = useState("");
    const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

    const borrowerNameValue = borrowerName ?? storedDraft?.name ?? publicSessionUser?.name ?? "";
    const identifierValue = identifier ?? (canEditIdentifier ? storedDraft?.identifier ?? "" : profileIdentifierValue);
    const emailValue = email ?? storedDraft?.email ?? publicSessionUser?.email ?? "";
    const phoneValue = phone ?? storedDraft?.phone ?? "";
    const purposeTitleValue = purposeTitle ?? storedDraft?.purpose ?? "";
    const purposeDetailValue = purposeDetail ?? storedDraft?.reason ?? "";
    const reservationFlowValue = (reservationFlow ?? storedDraft?.res_flow ?? "GENERAL") as ReservationFlow;
    const effectiveReservationFlow: ReservationFlow = isLabBuilding ? reservationFlowValue : "GENERAL";
    const supportingFileDataUrlValue = supportingFileDataUrl ?? storedDraft?.documentDataUrl ?? null;
    const supportingFileLabel = supportingFile?.name ?? storedDraft?.documentName ?? "Klik untuk unggah berkas";
    const activityTypeValue = activityType ?? (searchParams.get("activityType") as "AKADEMIK" | "NON_AKADEMIK") ?? storedDraft?.activityType ?? "NON_AKADEMIK";

    const handleSupportingFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setSupportingFile(file);

        if (!file) {
            setSupportingFileDataUrl(null);
            return;
        }

		if (file.size > 5 * 1024 * 1024) {
			setSupportingFile(null);
			setSupportingFileDataUrl(null);
            pushToast({
                type: "error",
                message: "Ukuran file terlalu besar (maks 5 MB). Silakan pilih file lain.",
            });
			return;
		}

        const reader = new FileReader();
        reader.onload = () => {
            setSupportingFileDataUrl(typeof reader.result === "string" ? reader.result : null);
        };
        reader.onerror = () => {
            setSupportingFileDataUrl(null);
        };
        reader.readAsDataURL(file);
    };

    const buildingGradient = getBuildingGradient(roomBuilding);

    const scheduleLabel = useMemo(() => {
        const dateLabel = startDate === endDate ? startDate : `${startDate} s/d ${endDate}`;
        return `${dateLabel} · ${startTime} - ${endTime} WITA`;
    }, [startDate, endDate, startTime, endTime]);

    useEffect(() => {
        if (!roomId || !roomBuilding || !startDate || !endDate || !startTime || !endTime) {
            setAvailabilityError("");
            return;
        }

        const abortController = new AbortController();

        const checkAvailability = async () => {
            setIsCheckingAvailability(true);
            setAvailabilityError("");

            try {
                const params = new URLSearchParams({
                    building: roomBuilding,
                    startDate,
                    endDate,
                    startTime,
                    endTime,
                    activityType: activityTypeValue,
                });

                const response = await fetch(`/api/rooms?${params.toString()}`, {
                    cache: "no-store",
                    signal: abortController.signal,
                });
                const payload = await response.json().catch(() => null);

                if (!response.ok) {
                    setAvailabilityError(
                        payload?.error ?? "Jadwal ruangan tidak tersedia. Silakan pilih ulang ruangan atau jadwal.",
                    );
                    return;
                }

                const rooms = Array.isArray(payload) ? payload : [];
                const stillAvailable = rooms.some((room) => room?.room_id === roomId);
                if (!stillAvailable) {
                    setAvailabilityError(
                        `Ruangan ${roomName} tidak tersedia pada tanggal dan waktu tersebut karena sudah digunakan untuk jadwal kuliah/praktikum/ujian atau reservasi lain.`,
                    );
                }
            } catch (error) {
                if (error instanceof DOMException && error.name === "AbortError") return;
                setAvailabilityError("Gagal mengecek ulang ketersediaan ruangan.");
            } finally {
                setIsCheckingAvailability(false);
            }
        };

        void checkAvailability();

        return () => abortController.abort();
    }, [roomId, roomName, roomBuilding, startDate, endDate, startTime, endTime, activityTypeValue]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!roomId || !startDate || !startTime || !endTime) {
            pushToast({
                type: "error",
                message: "Data jadwal tidak lengkap. Silakan pilih ulang ruangan dari halaman gedung.",
            });
            return;
        }

        if (availabilityError) {
            pushToast({
                type: "error",
                message: availabilityError,
            });
            return;
        }

        if (
            !borrowerNameValue ||
            (isCivitas && !identifierValue) ||
            !emailValue ||
            !phoneValue ||
            !purposeTitleValue ||
            !purposeDetailValue ||
            !supportingFileDataUrlValue
        ) {
            pushToast({
                type: "error",
                message: "Mohon lengkapi seluruh data wajib pada formulir reservasi.",
            });
            return;
        }

        if (isLabBuilding) {
            if (effectiveReservationFlow !== "LAB_SKRIPSI" && effectiveReservationFlow !== "LAB_LAINNYA") {
                pushToast({
                    type: "error",
                    message: "Kategori peminjaman lab wajib dipilih (Skripsi/Lainnya).",
                });
                return;
            }

        }

        const draftPayload = {
            room_id: roomId,
            room_name: roomName,
            room_building: roomBuilding,
            room_capacity: roomCapacity,
            room_locDetail: roomLocDetail,
            room_imageUrl: roomImageUrl,
            startDate,
            endDate,
            startTime,
            endTime,
            name: borrowerNameValue,
            identifier: identifierValue.trim(),
            identifierLabel: "NIM/NIP",
            email: emailValue,
            phone: phoneValue,
            purpose: purposeTitleValue,
            reason: purposeDetailValue,
            res_flow: effectiveReservationFlow,
            activityType: activityTypeValue,
            documentName: supportingFile?.name ?? storedDraft?.documentName ?? "Belum ada dokumen",
            documentSize: supportingFile?.size ?? storedDraft?.documentSize ?? null,
            documentType: supportingFile?.type ?? storedDraft?.documentType ?? null,
            documentDataUrl: supportingFileDataUrlValue,
        };

        sessionStorage.setItem("reservationDraft", JSON.stringify(draftPayload));
        router.push("/reservasi/konfirmasi");
    };

    return (
        <div className="min-h-screen bg-white font-sans">
            <Navbar />

            <section className="relative h-[62vh] min-h-105">
                <div className="absolute inset-0 overflow-hidden">
                    <div className={`absolute inset-0 bg-linear-to-br ${buildingGradient}`} />
                    <Image
                        src="/hero.jpeg"
                        alt="Fakultas Teknik"
                        fill
                        sizes="100vw"
                        className="object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-linear-to-b from-black/85 via-black/65 to-black/85 backdrop-blur-sm" />
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 pb-12">
                    <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-black tracking-tight">Formulir Reservasi</h1>
                    <p className="text-white/75 mt-2 text-sm lg:text-base max-w-md">
                        Lengkapi data peminjaman untuk ruangan yang sudah Anda pilih.
                    </p>
                </div>
            </section>

            <main className="px-4 md:px-8 pt-8 pb-14 max-w-5xl mx-auto">
                <nav className="flex items-center gap-1.5 text-[11px] lg:text-xs text-slate-500 mb-5 px-1">
                    <Link href="/landingpage" className="hover:text-slate-800 flex items-center gap-1 transition-colors">
                        <Home size={12} />
                        Gedung
                    </Link>
                    <span>/</span>
                    <Link
                        href={`/gedung/${encodeURIComponent(roomBuilding)}`}
                        className="hover:text-slate-800 transition-colors truncate"
                    >
                        {roomBuilding}
                    </Link>
                    <span>/</span>
                    <span className="text-slate-800 font-medium truncate">Formulir Reservasi</span>
                </nav>

                <section className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-[180px_1fr]">
                        
                        <div className="relative h-28 md:h-full bg-slate-100 overflow-hidden">
                        {roomImageUrl ? (
                            <Image 
                                src={roomImageUrl} 
                                alt={roomName} 
                                fill 
                                sizes="(max-width: 768px) 100vw, 180px"
                                className="w-full h-full object-cover" 
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Building2 size={32} />
                            </div>
                        )}
                        </div>

                        <div className="p-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[8px] lg:text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                            Ruangan Terpilih
                        </span>

                        <h2 className="mt-1 text-base lg:text-lg font-bold text-slate-900 leading-tight">
                            {roomName}
                        </h2>

                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                            <div className="text-[8px] lg:text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">
                                Gedung
                            </div>
                            <div className="text-[11px] lg:text-xs font-semibold text-slate-800 flex items-start gap-1">
                                <MapPin size={11} className="mt-0.5 shrink-0" />
                                <span>{roomBuilding}</span>
                            </div>
                            </div>

                            <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                            <div className="text-[8px] lg:text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">
                                Kapasitas
                            </div>
                            <div className="text-[11px] lg:text-xs font-semibold text-slate-800 flex items-center gap-1">
                                <Users size={11} className="shrink-0" />
                                <span>{roomCapacity} Orang</span>
                            </div>
                            </div>
                        </div>

                        <div className="mt-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                            <div className="text-[8px] lg:text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">
                            Detail Lokasi
                            </div>
                            <p className="text-[11px] lg:text-xs text-slate-700">{roomLocDetail || "-"}</p>
                        </div>
                        </div>
                    </div>
                </section>

                <section className="bg-white rounded-2xl border border-slate-100 shadow-xl p-4 sm:p-6 md:p-7">
                    <h3 className="text-center text-lg lg:text-xl font-black tracking-tight text-slate-900">FORMULIR RESERVASI</h3>
                    <div className="mx-auto mt-1 h-1 w-12 rounded-full bg-slate-800" />

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                            <div className="text-[10px] lg:text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">Tanggal Reservasi</div>
                            <div className="flex items-center gap-2 text-sm lg:text-base font-semibold text-slate-700">
                                <Calendar size={14} className="text-slate-500" />
                                {startDate === endDate ? startDate : `${startDate} s/d ${endDate}`}
                            </div>
                        </div>
                        <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                            <div className="text-[10px] lg:text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">Waktu Reservasi</div>
                            <div className="flex items-center gap-2 text-sm lg:text-base font-semibold text-slate-700">
                                <Clock size={14} className="text-slate-500" />
                                {startTime} - {endTime} WITA
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Users size={14} className="text-slate-700" />
                                <h4 className="text-xs lg:text-sm font-bold uppercase tracking-widest text-slate-800">
                                    Identitas Penanggung Jawab
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                <label className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] lg:text-xs font-semibold text-slate-600">Nama Lengkap</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={borrowerNameValue}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm lg:text-base text-slate-500 cursor-not-allowed outline-none"
                                        placeholder="Masukkan nama lengkap Anda"
                                        required
                                        readOnly
                                    />
                                </label>
                                {isCivitas && (
                                    <label className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] lg:text-xs font-semibold text-slate-600">NIM/NIP</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={identifierValue}
                                            onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, ""))}
                                            className={
                                                canEditIdentifier
                                                    ? "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm lg:text-base text-slate-700 outline-none focus:border-slate-400"
                                                    : "w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm lg:text-base text-slate-500 cursor-not-allowed outline-none"
                                            }
                                            placeholder="Masukkan NIM/NIP"
                                            required
                                            readOnly={!canEditIdentifier}
                                        />
                                    </label>
                                )}
                                <label className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] lg:text-xs font-semibold text-slate-600">Alamat Email</span>
                                    </div>
                                    <div className="relative">
                                        <Mail size={14} className="absolute left-3 top-3 text-slate-400" />
                                        <input
                                            type="email"
                                            value={emailValue}
                                            className="w-full rounded-lg border border-slate-200 bg-slate-100 pl-9 pr-3 py-2.5 text-sm lg:text-base text-slate-500 cursor-not-allowed outline-none"
                                            placeholder="Masukkan alamat email Anda"
                                            required
                                            readOnly
                                        />
                                    </div>
                                </label>
                                <label className="space-y-1.5">
                                    <span className="text-[11px] lg:text-xs font-semibold text-slate-600">Nomor Telepon</span>
                                    <div className="relative">
                                        <Phone size={14} className="absolute left-3 top-3 text-slate-400" />
                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            value={phoneValue}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, "");
                                                setPhone(value);
                                            }}
                                            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2.5 text-sm lg:text-base text-slate-700 outline-none focus:border-slate-400"
                                            placeholder="Masukkan nomor telepon Anda"
                                            required
                                        />
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Info size={14} className="text-slate-700" />
                                <h4 className="text-xs lg:text-sm font-bold uppercase tracking-widest text-slate-800">Detail Kegiatan</h4>
                            </div>

                            <div className="space-y-3.5">
                                <label className="space-y-1.5 block">
                                    <span className="text-[11px] lg:text-xs font-semibold text-slate-600">Nama Kegiatan</span>
                                    <input
                                        type="text"
                                        value={purposeTitleValue}
                                        onChange={(e) => setPurposeTitle(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm lg:text-base text-slate-700 outline-none focus:border-slate-400"
                                        placeholder="Masukkan nama kegiatan"
                                        required
                                    />
                                </label>

                                {isLabBuilding && (
                                    <label className="space-y-1.5 block">
                                        <span className="text-[11px] lg:text-xs font-semibold text-slate-600">Kategori Peminjaman Lab</span>
                                        <select
                                            value={effectiveReservationFlow}
                                            onChange={(e) => setReservationFlow(e.target.value as ReservationFlow)}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm lg:text-base text-slate-700 outline-none focus:border-slate-400"
                                            required
                                        >
                                            <option value="GENERAL">Pilih kategori</option>
                                            <option value="LAB_SKRIPSI">Skripsi</option>
                                            <option value="LAB_LAINNYA">Lainnya</option>
                                        </select>
                                    </label>
                                )}

                                <label className="space-y-1.5 block">
                                    <span className="text-[11px] lg:text-xs font-semibold text-slate-600">Jenis Kegiatan</span>
                                    <select
                                        value={activityTypeValue}
                                        onChange={(e) => setActivityType(e.target.value as "AKADEMIK" | "NON_AKADEMIK")}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm lg:text-base text-slate-700 outline-none cursor-not-allowed opacity-80"
                                        required
                                        disabled
                                    >
                                        <option value="NON_AKADEMIK">Non-Akademik (Kegiatan UKM, Rapat Organisasi, dll.)</option>
                                        <option value="AKADEMIK">Akademik (Perkuliahan, Ujian, Seminar Akademik, dll.)</option>
                                    </select>
                                </label>

                                <label className="space-y-1.5 block">
                                    <span className="text-[11px] lg:text-xs font-semibold text-slate-600">Alasan Peminjaman</span>
                                    <textarea
                                        value={purposeDetailValue}
                                        onChange={(e) => setPurposeDetail(e.target.value)}
                                        rows={3}
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm lg:text-base text-slate-700 outline-none focus:border-slate-400 resize-y"
                                        placeholder="Jelaskan secara singkat alasan dan tujuan peminjaman ruangan"
                                        required
                                    />
                                </label>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <FileText size={14} className="text-slate-700" />
                            <h4 className="text-xs lg:text-sm font-bold uppercase tracking-widest text-slate-800">
                                {isLabBuilding
                                    ? effectiveReservationFlow === "LAB_SKRIPSI"
                                        ? "SK Pembimbingan"
                                        : "Surat Pengantar"
                                    : "Surat Pengantar"}
                            </h4>
                            </div>

                            <label className="block rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center cursor-pointer hover:bg-slate-100 transition-colors">
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="hidden"
                                    onChange={handleSupportingFileChange}
                                    required={!supportingFileDataUrlValue}
                                />
                                <Upload size={24} className="mx-auto text-slate-400" />
                                <p className="mt-2 text-sm lg:text-base font-semibold text-slate-700 truncate px-2 w-full">
                                    {supportingFileLabel}
                                </p>
                                <p className="text-[11px] lg:text-xs text-slate-500 mt-1">Format: PDF/JPG/PNG (maks 5 MB)</p>
                            </label>
                        </div>

                        <div className="border-t border-slate-100 pt-5">
                            {availabilityError ? (
                                <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                                    {availabilityError}
                                </div>
                            ) : isCheckingAvailability ? (
                                <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                                    Mengecek ulang ketersediaan ruangan...
                                </div>
                            ) : null}
                            <button
                                type="submit"
                                disabled={Boolean(availabilityError) || isCheckingAvailability}
                                className="w-full rounded-lg bg-slate-900 px-5 py-3 text-sm lg:text-base font-bold uppercase tracking-widest text-white hover:bg-slate-700 transition-colors disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                                Konfirmasi Reservasi
                            </button>
                            <p className="mt-2 text-[11px] lg:text-xs text-slate-400">
                                Dengan mengklik konfirmasi, Anda menyetujui seluruh ketentuan peminjaman fasilitas kampus.
                            </p>
                            <p className="mt-2 text-[11px] lg:text-xs text-slate-500">
                                Jadwal dipilih: <span className="font-semibold">{scheduleLabel}</span>
                            </p>
                        </div>
                    </form>
                </section>
            </main>

            <footer className="bg-slate-900 py-5 text-center">
                <p className="text-xs lg:text-sm text-slate-400">© 2026 FATEK UNSRAT · Website Reservasi Ruangan</p>
            </footer>
        </div>
    );
}

export default function ReservasiPage() {
    return (
        <Suspense fallback={null}>
            <ReservasiContent />
        </Suspense>
    );
}
