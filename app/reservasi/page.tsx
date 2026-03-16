"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import Navbar from "@/components/layout/Navbar";

const buildingColorMap: Record<string, string> = {
    "Gedung Dekanat Fakultas Teknik": "from-sky-900 to-sky-700",
    "Gedung Jurusan Teknik Sipil": "from-blue-900 to-blue-700",
    "Gedung Jurusan Teknik Arsitektur": "from-slate-800 to-slate-600",
    "Gedung Jurusan Teknik Elektro": "from-green-800 to-green-600",
    "Gedung Jurusan Teknik Mesin": "from-indigo-900 to-indigo-700",
    "Gedung Laboratorium Fakultas Teknik": "from-lime-900 to-lime-700",
};

export default function ReservasiPage() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();

    const roomId = searchParams.get("room_id") ?? "";
    const roomName = searchParams.get("room_name") ?? "Ruangan";
    const roomBuilding = searchParams.get("room_building") ?? "Gedung tidak diketahui";
    const roomCapacity = searchParams.get("room_capacity") ?? "-";
    const roomLocDetail = searchParams.get("room_locDetail") ?? "";
    const roomImageUrl = searchParams.get("room_imageUrl") ?? "";

    const startDate = searchParams.get("startDate") ?? "";
    const endDate = searchParams.get("endDate") ?? startDate;
    const startTime = searchParams.get("startTime") ?? "";
    const endTime = searchParams.get("endTime") ?? "";

    const isCivitas = session?.user?.userType === "STUDENT" || session?.user?.userType === "STAFF";

    const [borrowerName, setBorrowerName] = useState("");
    const [identifier, setIdentifier] = useState("");
    const [email, setEmail] = useState("");

    useEffect(() => {
        if (!session?.user) return;
        setBorrowerName(session.user.name ?? "");
        setEmail(session.user.email ?? "");
        if (isCivitas) setIdentifier(session.user.identifier ?? "");
    }, [session, isCivitas]);
    const [phone, setPhone] = useState("");
    const [purposeTitle, setPurposeTitle] = useState("");
    const [purposeDetail, setPurposeDetail] = useState("");
    const [supportingFile, setSupportingFile] = useState<File | null>(null);
    const [validationError, setValidationError] = useState("");

    const buildingGradient = buildingColorMap[roomBuilding] ?? "from-slate-700 via-slate-600 to-slate-800";

    const scheduleLabel = useMemo(() => {
        const dateLabel = startDate === endDate ? startDate : `${startDate} s/d ${endDate}`;
        return `${dateLabel} · ${startTime} - ${endTime} WITA`;
    }, [startDate, endDate, startTime, endTime]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setValidationError("");

        if (!roomId || !startDate || !startTime || !endTime) {
            setValidationError("Data jadwal tidak lengkap. Silakan pilih ulang ruangan dari halaman gedung.");
            return;
        }

        if (!borrowerName || !email || !phone || !purposeTitle || !purposeDetail) {
            setValidationError("Mohon lengkapi seluruh data wajib pada formulir reservasi.");
            return;
        }

        alert("Form reservasi tersimpan di sisi UI. Integrasi submit API bisa ditambahkan di langkah berikutnya.");
    };

    return (
        <div className="min-h-screen bg-[#f5f5f0] font-sans">
            <Navbar />

            <section className="relative flex flex-col justify-end pt-20 pb-10 min-h-56">
                <div className="absolute inset-0 overflow-hidden">
                    <div className={`absolute inset-0 bg-linear-to-br ${buildingGradient}`} />
                    <div className="absolute inset-0 bg-black/40" />
                </div>

                <div className="relative z-10 flex flex-col items-center text-center px-4">
                    <h1 className="text-white text-3xl md:text-4xl font-black tracking-tight">Formulir Reservasi</h1>
                    <p className="text-white/75 mt-2 text-sm max-w-md">
                        Lengkapi data peminjaman untuk ruangan yang sudah Anda pilih.
                    </p>
                </div>
            </section>

            <main className="px-4 md:px-8 pt-8 pb-14 max-w-5xl mx-auto">
                <nav className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-5 px-1">
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
                        
                        <div className="h-28 md:h-full bg-slate-100">
                        {roomImageUrl ? (
                            <img src={roomImageUrl} alt={roomName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Building2 size={32} />
                            </div>
                        )}
                        </div>

                        <div className="p-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-bold text-slate-600 uppercase tracking-wider">
                            Ruangan Terpilih
                        </span>

                        <h2 className="mt-1 text-base font-bold text-slate-900 leading-tight">
                            {roomName}
                        </h2>

                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">
                                Gedung
                            </div>
                            <div className="text-[11px] font-semibold text-slate-800 flex items-start gap-1">
                                <MapPin size={11} className="mt-0.5 shrink-0" />
                                <span>{roomBuilding}</span>
                            </div>
                            </div>

                            <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">
                                Kapasitas
                            </div>
                            <div className="text-[11px] font-semibold text-slate-800 flex items-center gap-1">
                                <Users size={11} className="shrink-0" />
                                <span>{roomCapacity} Orang</span>
                            </div>
                            </div>
                        </div>

                        <div className="mt-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">
                            Detail Lokasi
                            </div>
                            <p className="text-[11px] text-slate-700">{roomLocDetail || "-"}</p>
                        </div>
                        </div>
                    </div>
                </section>

                <section className="bg-white rounded-2xl border border-slate-100 shadow-xl p-4 sm:p-6 md:p-7">
                    <h3 className="text-center text-lg font-black tracking-tight text-slate-900">FORMULIR RESERVASI</h3>
                    <div className="mx-auto mt-1 h-1 w-12 rounded-full bg-slate-800" />

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Tanggal Reservasi</div>
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <Calendar size={14} className="text-slate-500" />
                                {startDate === endDate ? startDate : `${startDate} s/d ${endDate}`}
                            </div>
                        </div>
                        <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Waktu Reservasi</div>
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <Clock size={14} className="text-slate-500" />
                                {startTime} - {endTime} WITA
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Users size={14} className="text-slate-700" />
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-800">
                                    Identitas Penanggung Jawab
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                <label className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-semibold text-slate-600">Nama Lengkap</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={borrowerName}
                                        onChange={(e) => setBorrowerName(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
                                        placeholder="Contoh: Budi Santoso"
                                        required
                                    />
                                </label>
                                {isCivitas && (
                                    <label className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-semibold text-slate-600">
                                                {session?.user?.userType === "STAFF" ? "NIP" : "NIM"}
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            value={identifier}
                                            onChange={(e) => setIdentifier(e.target.value)}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
                                            placeholder={session?.user?.userType === "STAFF" ? "Nomor Induk Pegawai" : "Nomor Induk Mahasiswa"}
                                        />
                                    </label>
                                )}
                                <label className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-semibold text-slate-600">Alamat Email</span>
                                    </div>
                                    <div className="relative">
                                        <Mail size={14} className="absolute left-3 top-3 text-slate-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
                                            placeholder="nama@email.com"
                                            required
                                        />
                                    </div>
                                </label>
                                <label className="space-y-1.5">
                                    <span className="text-[11px] font-semibold text-slate-600">Nomor WhatsApp</span>
                                    <div className="relative">
                                        <Phone size={14} className="absolute left-3 top-3 text-slate-400" />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
                                            placeholder="08xxxxxxxxxx"
                                            required
                                        />
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Info size={14} className="text-slate-700" />
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-800">Detail Kegiatan</h4>
                            </div>
                            <div className="space-y-3.5">
                                <label className="space-y-1.5 block">
                                    <span className="text-[11px] font-semibold text-slate-600">Nama Kegiatan</span>
                                    <input
                                        type="text"
                                        value={purposeTitle}
                                        onChange={(e) => setPurposeTitle(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
                                        placeholder="Contoh: Seminar Teknologi Masa Depan"
                                        required
                                    />
                                </label>

                                <label className="space-y-1.5 block">
                                    <span className="text-[11px] font-semibold text-slate-600">Alasan Peminjaman</span>
                                    <textarea
                                        value={purposeDetail}
                                        onChange={(e) => setPurposeDetail(e.target.value)}
                                        rows={3}
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400 resize-y"
                                        placeholder="Jelaskan secara singkat tujuan peminjaman ruangan"
                                        required
                                    />
                                </label>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <FileText size={14} className="text-slate-700" />
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-800">Dokumen Pendukung</h4>
                            </div>

                            <label className="block rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center cursor-pointer hover:bg-slate-100 transition-colors">
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="hidden"
                                    onChange={(e) => setSupportingFile(e.target.files?.[0] ?? null)}
                                />
                                <Upload size={24} className="mx-auto text-slate-400" />
                                <p className="mt-2 text-sm font-semibold text-slate-700">
                                    {supportingFile ? supportingFile.name : "Klik untuk unggah berkas"}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-1">Format: PDF/JPG/PNG (maks 5 MB)</p>
                            </label>
                        </div>

                        {validationError && (
                            <p className="text-sm font-medium text-red-600 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                                {validationError}
                            </p>
                        )}

                        <div className="border-t border-slate-100 pt-5">
                            <button
                                type="submit"
                                className="w-full rounded-lg bg-slate-900 px-5 py-3 text-sm font-bold uppercase tracking-widest text-white hover:bg-slate-700 transition-colors"
                            >
                                Konfirmasi Reservasi
                            </button>
                            <p className="mt-2 text-[11px] text-slate-400">
                                Dengan mengklik konfirmasi, Anda menyetujui seluruh ketentuan peminjaman fasilitas kampus.
                            </p>
                            <p className="mt-2 text-[11px] text-slate-500">
                                Jadwal dipilih: <span className="font-semibold">{scheduleLabel}</span>
                            </p>
                        </div>
                    </form>
                </section>
            </main>

            <footer className="bg-slate-900 py-5 text-center">
                <p className="text-xs text-slate-400">© 2026 FATEK UNSRAT · Website Reservasi Ruangan</p>
            </footer>
        </div>
    );
}
