"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Calendar,
  Clock,
  FileText,
  Home,
  User,
  Users,
  File as FileIcon,
  ChevronRight,
  ArrowLeft,
  Building2,
  Eye,
} from "lucide-react";
import { useEffect, useState } from "react";
import Navbar from "@/app/components/layout/NavbarClient";
import { useToast } from "@/app/components/ui/toast";

import { isLabBuilding, getBuildingGradient } from "@/app/utils/building";
import { isPrivilegedStaffUser } from "@/lib/role-access";

type ReservationFlow = "GENERAL" | "LAB_SKRIPSI" | "LAB_LAINNYA";

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
  identifierLabel: "NIM" | "NIP" | "NIM/NIP";
  email: string;
  phone: string;
  purpose: string;
  reason: string;
	res_flow?: ReservationFlow;
  activityType?: "AKADEMIK" | "NON_AKADEMIK";
  documentName: string;
  documentSize: number | null;
  documentType: string | null;
  documentDataUrl?: string | null;
};

type SubmittedReservation = {
  res_id: string;
  res_startTime: string;
  res_endTime: string;
  room: {
    room_name: string;
    room_building: string;
  };
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
  res_flow: "GENERAL",
  activityType: "NON_AKADEMIK",
  documentName: "Belum ada dokumen",
  documentSize: null,
  documentType: null,
  documentDataUrl: null,
};

export default function KonfirmasiReservasiPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isPrivilegedStaff = isPrivilegedStaffUser(session?.user);
  const { pushToast } = useToast();
  const [reservation, setReservation] = useState<ReservationDraft | null>(null);
  const [submitted, setSubmitted] = useState<SubmittedReservation | null>(null);
  const [loading, setLoading] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const uploadSupportingDocument = async () => {
    if (!reservation?.documentDataUrl) return null;

    const response = await fetch(reservation.documentDataUrl);
    const blob = await response.blob();
    const fileName = reservation.documentName && reservation.documentName !== "Belum ada dokumen" ? reservation.documentName : "dokumen";
    const fileType = reservation.documentType || blob.type || "application/octet-stream";
    const file = new File([blob], fileName, { type: fileType });

    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await fetch("/api/reservasi/document", {
      method: "POST",
      body: formData,
    });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok || !uploadData?.documentUrl) {
      throw new Error(uploadData?.error || "Gagal mengupload dokumen.");
    }

    return uploadData.documentUrl as string;
  };

  const handleEditData = () => {
    if (!reservation) {
      router.push("/reservasi");
      return;
    }

    sessionStorage.setItem("reservationDraft", JSON.stringify(reservation));
    router.push("/reservasi");
  };

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

  const buildingGradient = getBuildingGradient(reservation.room_building);

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

  const handlePreviewDocument = () => {
    if (!reservation.documentDataUrl) return;

    // Avoid duplicating large base64 data in sessionStorage (can exceed quota).
    sessionStorage.removeItem("previewDocumentData");

    const previewWindow = window.open("/reservasi/preview", "_blank");
    if (!previewWindow) return;

    const payload = {
      type: "RESERVASI_PREVIEW_DOCUMENT" as const,
      dataUrl: reservation.documentDataUrl,
      name: reservation.documentName,
    };

    const origin = window.location.origin;

    const sendPayload = () => {
      try {
        previewWindow.postMessage(payload, origin);
      } catch {
        // ignore
      }
    };

    // Send immediately + retry (listener might not be ready yet), plus handshake support.
    sendPayload();
    window.setTimeout(sendPayload, 200);
    window.setTimeout(sendPayload, 800);

    let cleanupTimeout = 0;

    const onReady = (event: MessageEvent) => {
      if (event.origin !== origin) return;
      if (!event.data || event.data.type !== "RESERVASI_PREVIEW_READY") return;
      sendPayload();
      window.removeEventListener("message", onReady);
      window.clearTimeout(cleanupTimeout);
    };

    window.addEventListener("message", onReady);

    cleanupTimeout = window.setTimeout(() => {
      window.removeEventListener("message", onReady);
    }, 2000);
  };

  const submitReservation = async () => {
    setLoading(true);
    try {
      if (!session?.user?.id || isPrivilegedStaff) {
        pushToast({ type: "error", message: "Sesi login tidak ditemukan. Silakan login ulang." });
        return;
      }

      const now = new Date();
      const startDateTime = new Date(`${reservation.startDate}T${reservation.startTime}:00+08:00`);
      const endDateSource = reservation.endDate || reservation.startDate;
      const endDateTime = new Date(`${endDateSource}T${reservation.endTime}:00+08:00`);

      const payload = {
        room_id: reservation.room_id,
        res_startTime: Number.isNaN(startDateTime.getTime()) ? now.toISOString() : startDateTime.toISOString(),
        res_endTime: Number.isNaN(endDateTime.getTime())
          ? new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString()
          : endDateTime.toISOString(),
        res_purpose: reservation.reason && reservation.reason !== "-" ? `${reservation.purpose} - ${reservation.reason}` : reservation.purpose,
        res_flow: reservation.res_flow ?? "GENERAL",
        res_activityType: reservation.activityType ?? "NON_AKADEMIK",
        res_documentUrl: null as string | null,
        borrower_identifier: reservation.identifier,
      };

      const isLab = isLabBuilding(reservation.room_building);
      if (isLab) {
        if (payload.res_flow !== "LAB_SKRIPSI" && payload.res_flow !== "LAB_LAINNYA") {
          pushToast({
            type: "error",
            message: "Kategori peminjaman lab wajib dipilih (Skripsi/Lainnya). Silakan kembali dan lengkapi data.",
          });
          return;
        }
        if (!reservation.documentDataUrl) {
          pushToast({ type: "error", message: "Dokumen pendukung wajib diunggah untuk peminjaman lab." });
          return;
        }
      }

      // Re-check ketersediaan ruangan sebelum submit (mencegah bentrok jika user lain sudah mengambil slot)
      try {
        const availParams = new URLSearchParams({
          startDate: reservation.startDate,
          endDate: reservation.endDate || reservation.startDate,
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          building: reservation.room_building,
          activityType: reservation.activityType || "NON_AKADEMIK",
        });
        const availCheckRes = await fetch(`/api/rooms?${availParams.toString()}`);
        const availRooms = await availCheckRes.json();
        if (availCheckRes.ok && Array.isArray(availRooms)) {
          const stillAvailable = availRooms.some(
            (r: { room_id: string }) => r.room_id === reservation.room_id
          );
          if (!stillAvailable) {
            pushToast({
              type: "error",
              message: "Ruangan sudah tidak tersedia untuk jadwal yang dipilih. Silakan pilih ruangan atau jadwal lain.",
            });
            return;
          }
        }
      } catch {
        // Lanjutkan jika pengecekan gagal — backend tetap akan memvalidasi
      }

      const uploadedDocumentUrl = await uploadSupportingDocument();
      payload.res_documentUrl = uploadedDocumentUrl;

      const res = await fetch("/api/reservasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        pushToast({ type: "error", message: data.error || "Gagal menyimpan reservasi." });
      } else {
        setSubmitted(data);
        router.push("/riwayat");
      }
    } catch (error) {
      pushToast({
        type: "error",
        message: error instanceof Error ? error.message : "Terjadi kesalahan saat submit reservasi.",
      });
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-black tracking-tight">Konfirmasi Reservasi</h1>
          <p className="text-white/75 mt-2 text-sm lg:text-base max-w-md">
            Periksa kembali seluruh data sebelum reservasi diproses.
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 md:px-8 pt-8 pb-16">
        <nav className="flex items-center gap-1.5 text-[11px] lg:text-xs text-slate-500 mb-5 px-1">
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
          <div className="flex items-start justify-between gap-2 mb-6">
            <div>
              <h2 className="text-xl lg:text-2xl font-black tracking-tight text-slate-900">Ringkasan Reservasi</h2>
              <p className="text-sm lg:text-base text-slate-500 mt-1">Pastikan data ruangan, jadwal, dan identitas sudah benar.</p>
            </div>
            {!submitted && (
              <button
                className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] md:text-xs lg:text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                onClick={handleEditData}
              >
                <ArrowLeft size={13} />
                <span className="whitespace-nowrap">Ubah Data</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={16} className="text-slate-700" />
                <span className="text-[11px] lg:text-xs font-bold uppercase tracking-widest text-slate-600">Ruangan Terpilih</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px] lg:text-xs text-slate-500">Nama Ruangan</div>
                  <div className="text-sm lg:text-base font-semibold text-slate-900">{submitted ? submitted.room.room_name : reservation.room_name}</div>
                </div>
                <div>
                  <div className="text-[11px] lg:text-xs text-slate-500">Gedung</div>
                  <div className="text-sm lg:text-base font-semibold text-slate-900">{submitted ? submitted.room.room_building : reservation.room_building}</div>
                </div>
                <div>
                  <div className="text-[11px] lg:text-xs text-slate-500">Kapasitas</div>
                  <div className="text-sm lg:text-base font-semibold text-slate-900">{reservation.room_capacity ? `${reservation.room_capacity} Orang` : "-"}</div>
                </div>
                <div>
                  <div className="text-[11px] lg:text-xs text-slate-500">Detail Lokasi</div>
                  <div className="text-sm lg:text-base font-semibold text-slate-900">{reservation.room_locDetail || "-"}</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={16} className="text-slate-700" />
                <span className="text-[11px] lg:text-xs font-bold uppercase tracking-widest text-slate-600">Jadwal Reservasi</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm lg:text-base text-slate-700">
                  <Calendar size={14} />
                  <span className="font-semibold">{submitted ? new Date(submitted.res_startTime).toLocaleDateString() : reservationDate}</span>
                </div>
                <div className="flex items-center gap-2 text-sm lg:text-base text-slate-700">
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
                <span className="text-[11px] lg:text-xs font-bold uppercase tracking-widest text-slate-600">Identitas Penanggung Jawab</span>
              </div>
              <div className="grid grid-cols-1 gap-3 text-sm lg:text-base">
                <div>
                  <div className="text-[11px] lg:text-xs text-slate-500">Nama Lengkap</div>
                  <div className="font-semibold text-slate-900">{reservation.name}</div>
                </div>
                <div>
                  <div className="text-[11px] lg:text-xs text-slate-500">{reservation.identifierLabel}</div>
                  <div className="font-semibold text-slate-900">{reservation.identifier || "-"}</div>
                </div>
                <div>
                  <div className="text-[11px] lg:text-xs text-slate-500">Alamat Email</div>
                  <div className="font-semibold text-slate-900 break-all">{reservation.email}</div>
                </div>
                <div>
                  <div className="text-[11px] lg:text-xs text-slate-500">Nomor Telepon</div>
                  <div className="font-semibold text-slate-900">{reservation.phone}</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-slate-700" />
                <span className="text-[11px] lg:text-xs font-bold uppercase tracking-widest text-slate-600">Detail Kegiatan</span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-[11px] lg:text-xs text-slate-500">Nama Kegiatan</div>
                  <div className="font-semibold text-slate-900">{reservation.purpose}</div>
                </div>
                <div>
                  <div className="text-[11px] lg:text-xs text-slate-500">Jenis Kegiatan</div>
                  <div className="font-semibold text-slate-900">
                    {reservation.activityType === "AKADEMIK" ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                        Akademik
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                        Non-Akademik
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] lg:text-xs text-slate-500">Alasan Peminjaman</div>
                  <div className="text-sm lg:text-base text-slate-800 leading-relaxed">{reservation.reason}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileIcon size={16} className="text-slate-700" />
              <span className="text-[11px] lg:text-xs font-bold uppercase tracking-widest text-slate-600">Surat Pengantar</span>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
              <FileText className="text-red-400" size={24} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 text-sm lg:text-base truncate">{reservation.documentName}</div>
                <div className="text-xs lg:text-sm text-slate-500">
                  {reservation.documentType || "File"} • {formatFileSize(reservation.documentSize)}
                </div>
              </div>
              <button
                type="button"
                className={`transition-colors ${reservation.documentDataUrl ? "text-slate-700 hover:text-slate-900" : "text-slate-400 cursor-not-allowed"}`}
                title={reservation.documentDataUrl ? "Preview dokumen" : "Preview tidak tersedia karena dokumen belum diunggah"}
                onClick={handlePreviewDocument}
                disabled={!reservation.documentDataUrl}
              >
                <Eye size={18} />
              </button>
            </div>
          </div>

          {!submitted && (
            <button
              className="w-full mt-6 bg-slate-900 text-white rounded-xl px-6 py-3 text-base lg:text-lg font-semibold hover:bg-slate-700 transition-all shadow-lg shadow-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-500"
              disabled={loading}
              onClick={() => setIsConfirmModalOpen(true)}
            >
              {loading ? "Menyimpan..." : "KONFIRMASI RESERVASI"}
            </button>
          )}

          {submitted && (
            <div className="mt-6 text-center text-green-700 font-semibold text-sm lg:text-base space-y-3">
              <p>Reservasi berhasil disimpan!</p>
              <button
                type="button"
                onClick={() => router.push("/riwayat")}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-4 py-2 text-xs lg:text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
              >
                Lihat Riwayat Peminjaman <ChevronRight size={14} />
              </button>
            </div>
          )}

          <div className="mt-4 text-[11px] lg:text-xs text-slate-400 text-center">
            Dengan menklik konfirmasi, Anda menyetujui seluruh tata tertib penggunaan fasilitas kampus FATEK UNSRAT yang berlaku secara akademik dan administratif.
          </div>
        </section>

        {isConfirmModalOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !loading) {
                setIsConfirmModalOpen(false);
              }
            }}
            role="presentation"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="konfirmasi-reservasi-title"
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
            >
              <h3 id="konfirmasi-reservasi-title" className="text-lg font-black tracking-tight text-slate-900">
                Konfirmasi Reservasi
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Apakah Anda yakin ingin melakukan reservasi? Periksa kembali data peminjaman Anda.
              </p>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(false)}
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await submitReservation();
                  }}
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Menyimpan..." : "Ya, Saya Yakin"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <footer className="bg-slate-900 py-5 text-center">
        <p className="text-xs lg:text-sm text-slate-400">© 2026 FATEK UNSRAT · Website Reservasi Ruangan</p>
      </footer>
    </div>
  );
}
