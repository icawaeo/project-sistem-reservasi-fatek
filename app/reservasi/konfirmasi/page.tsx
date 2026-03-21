"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Calendar,
  Clock,
  FileText,
  Home,
  MapPin,
  User,
  Users,
  Mail,
  Phone,
  File,
  ChevronRight,
  ArrowLeft,
  Building2,
  Eye,
  Download,
} from "lucide-react";
import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";

const buildingColorMap = {
  "Gedung Dekanat Fakultas Teknik": "from-sky-900 to-sky-700",
  "Gedung Jurusan Teknik Sipil": "from-blue-900 to-blue-700",
  "Gedung Jurusan Teknik Arsitektur": "from-slate-800 to-slate-600",
  "Gedung Jurusan Teknik Elektro": "from-green-800 to-green-600",
  "Gedung Jurusan Teknik Mesin": "from-indigo-900 to-indigo-700",
  "Gedung Laboratorium Fakultas Teknik": "from-lime-900 to-lime-700",
};

type ReservationDraft = {
  room_id?: string;
  room_name: string;
  room_building: string;
  room_capacity?: string;
  room_locDetail?: string;
  room_imageUrl?: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  name: string;
  identifier: string;
  identifierLabel: "NIM" | "NIP";
  email: string;
  phone: string;
  purpose: string;
  reason: string;
  documentName: string;
  documentSize: number | null;
  documentType: string | null;
};

const fallbackReservation: ReservationDraft = {
  room_name: "Ruangan",
  room_building: "Gedung tidak diketahui",
  startDate: "-",
  endDate: "-",
  startTime: "-",
  endTime: "-",
  name: "-",
  identifier: "-",
  identifierLabel: "NIM",
  email: "-",
  phone: "-",
  purpose: "-",
  reason: "-",
  documentName: "Belum ada dokumen",
  documentSize: null,
  documentType: null,
};

export default function KonfirmasiReservasiPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [reservation, setReservation] = useState<ReservationDraft | null>(null);
  const [submitted, setSubmitted] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedDraft = sessionStorage.getItem("reservationDraft");
    if (storedDraft) {
      try {
        const parsed = JSON.parse(storedDraft) as ReservationDraft;
        setReservation({ ...fallbackReservation, ...parsed });
        return;
      } catch {
        setReservation(fallbackReservation);
        return;
      }
    }

    setReservation(fallbackReservation);
  }, []);

  if (!reservation) return null;

  const buildingGradient =
    buildingColorMap[reservation.room_building as keyof typeof buildingColorMap] || "from-slate-700 via-slate-600 to-slate-800";

  const reservationDate =
    reservation.startDate === reservation.endDate
      ? reservation.startDate
      : `${reservation.startDate} s/d ${reservation.endDate}`;

  const formatFileSize = (sizeInBytes: number | null) => {
    if (!sizeInBytes) return "-";
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
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
          <h1 className="text-white text-3xl md:text-4xl font-black tracking-tight">Konfirmasi Reservasi</h1>
          <p className="text-white/75 mt-2 text-sm max-w-md">
            Periksa kembali seluruh data sebelum reservasi diproses.
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 md:px-8 pt-8 pb-16">
        <nav className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-5 px-1">
          <Link href="/landingpage" className="hover:text-slate-800 flex items-center gap-1 transition-colors">
            <Home size={12} />
            Gedung
          </Link>
          <span>/</span>
          <Link href="/reservasi" className="hover:text-slate-800 transition-colors truncate">
            Formulir Reservasi
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-medium truncate">Konfirmasi Reservasi</span>
        </nav>

        <section className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5 md:p-7">
          {error && (
            <div className="mb-4 text-sm text-red-600 font-semibold text-center">{error}</div>
          )}

          <div className="flex items-start justify-between gap-2 mb-6">
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900">Ringkasan Reservasi</h2>
              <p className="text-sm text-slate-500 mt-1">Pastikan data ruangan, jadwal, dan identitas sudah benar.</p>
            </div>
            {!submitted && (
              <button
                className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                onClick={() => router.push("/reservasi")}
              >
                <ArrowLeft size={13} /> Ubah Data
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={16} className="text-slate-700" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600">Ruangan Terpilih</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px] text-slate-500">Nama Ruangan</div>
                  <div className="text-sm font-semibold text-slate-900">{submitted ? submitted.room.room_name : reservation.room_name}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Gedung</div>
                  <div className="text-sm font-semibold text-slate-900">{submitted ? submitted.room.room_building : reservation.room_building}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Kapasitas</div>
                  <div className="text-sm font-semibold text-slate-900">{reservation.room_capacity ? `${reservation.room_capacity} Orang` : "-"}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Detail Lokasi</div>
                  <div className="text-sm font-semibold text-slate-900">{reservation.room_locDetail || "-"}</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={16} className="text-slate-700" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600">Jadwal Reservasi</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Calendar size={14} />
                  <span className="font-semibold">{submitted ? new Date(submitted.res_startTime).toLocaleDateString() : reservationDate}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Clock size={14} />
                  <span className="font-semibold">
                    {submitted
                      ? `${new Date(submitted.res_startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(submitted.res_endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} WITA`
                      : `${reservation.startTime} - ${reservation.endTime} WITA`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <User size={16} className="text-slate-700" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600">Identitas Penanggung Jawab</span>
              </div>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div>
                  <div className="text-[11px] text-slate-500">Nama Lengkap</div>
                  <div className="font-semibold text-slate-900">{reservation.name}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">{reservation.identifierLabel}</div>
                  <div className="font-semibold text-slate-900">{reservation.identifier || "-"}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Alamat Email</div>
                  <div className="font-semibold text-slate-900 break-all">{reservation.email}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Nomor WhatsApp</div>
                  <div className="font-semibold text-slate-900">{reservation.phone}</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-slate-700" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600">Detail Kegiatan</span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-[11px] text-slate-500">Nama Kegiatan</div>
                  <div className="font-semibold text-slate-900">{reservation.purpose}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Alasan Peminjaman</div>
                  <div className="text-sm text-slate-800 leading-relaxed">{reservation.reason}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <File size={16} className="text-slate-700" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600">Surat Pengantar</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
              <FileText className="text-red-400" size={24} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 text-sm truncate">{reservation.documentName}</div>
                <div className="text-xs text-slate-500">
                  {reservation.documentType || "File"} • {formatFileSize(reservation.documentSize)}
                </div>
              </div>
              <button
                type="button"
                className="text-slate-400 cursor-not-allowed"
                title="Preview akan tersedia setelah integrasi upload backend"
              >
                <Eye size={18} />
              </button>
              <button
                type="button"
                className="text-slate-400 cursor-not-allowed"
                title="Download akan tersedia setelah integrasi upload backend"
              >
                <Download size={18} />
              </button>
            </div>
          </div>

          {!submitted && (
            <button
              className="w-full mt-6 bg-slate-900 text-white rounded-xl px-6 py-3 text-base font-semibold hover:bg-slate-700 transition-all shadow-lg shadow-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-500"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                setError("");
                try {
                  if (!session?.user?.id) {
                    setError("Sesi login tidak ditemukan. Silakan login ulang.");
                    setLoading(false);
                    return;
                  }

                  const now = new Date();
                  const startDateTime = new Date(`${reservation.startDate}T${reservation.startTime}:00`);
                  const endDateSource = reservation.endDate || reservation.startDate;
                  const endDateTime = new Date(`${endDateSource}T${reservation.endTime}:00`);

                  const payload = {
                    room_id: reservation.room_id,
                    res_startTime: Number.isNaN(startDateTime.getTime()) ? now.toISOString() : startDateTime.toISOString(),
                    res_endTime: Number.isNaN(endDateTime.getTime())
                      ? new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString()
                      : endDateTime.toISOString(),
                    res_purpose: reservation.purpose,
                    res_documentUrl: null,
                  };

                  const res = await fetch("/api/reservasi", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    setError(data.error || "Gagal menyimpan reservasi.");
                  } else {
                    setSubmitted(data);
                  }
                } catch {
                  setError("Terjadi kesalahan saat submit reservasi.");
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? "Menyimpan..." : "KONFIRMASI RESERVASI"}
            </button>
          )}

          {submitted && (
            <div className="mt-6 text-center text-green-700 font-semibold text-sm space-y-3">
              <p>Reservasi berhasil disimpan!</p>
              <button
                type="button"
                onClick={() => router.push("/riwayat")}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
              >
                Lihat Riwayat Peminjaman <ChevronRight size={14} />
              </button>
            </div>
          )}

          <div className="mt-4 text-[11px] text-slate-400 text-center">
            Dengan menklik konfirmasi, Anda menyetujui seluruh tata tertib penggunaan fasilitas kampus FATEK UNSRAT yang berlaku secara akademik dan administratif.
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 py-5 text-center">
        <p className="text-xs text-slate-400">© 2026 FATEK UNSRAT · Website Reservasi Ruangan</p>
      </footer>
    </div>
  );
}
