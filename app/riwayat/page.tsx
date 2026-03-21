"use client";

import { type ComponentType, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Calendar,
  Clock,
  FileText,
  Home,
  History,
  Hourglass,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  FileCheck2,
  Building2,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";

type ReservationStatus = "PENDING" | "APPROVED" | "REJECTED" | string;

type ReservationRecord = {
  res_id: string;
  res_startTime: string;
  res_endTime: string;
  res_status: ReservationStatus;
  res_purpose: string;
  res_documentUrl: string | null;
  room: {
    room_name: string;
    room_building: string;
  };
};

type ReservationDraftSnapshot = {
  purpose?: string;
  reason?: string;
  documentName?: string;
};

type ReservationsResponse = {
  reservations: ReservationRecord[];
  sort: "newest" | "oldest";
};

const statusMeta: Record<string, { label: string; badge: string; icon: ComponentType<{ size?: number; className?: string }> }> = {
  PENDING: {
    label: "Menunggu",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Hourglass,
  },
  APPROVED: {
    label: "Disetujui",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Ditolak",
    badge: "bg-rose-100 text-rose-700 border-rose-200",
    icon: XCircle,
  },
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const formatTime = (start: string, end: string) => {
  const startLabel = new Date(start).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const endLabel = new Date(end).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${startLabel} - ${endLabel} WITA`;
};

const formatDateRange = (start: string, end: string) => {
  const startDate = formatDate(start);
  const endDate = formatDate(end);

  if (startDate === endDate) {
    return startDate;
  }

  return `${startDate} - ${endDate}`;
};

const formatDateTimeFull = (start: string, end: string) => {
  const startLabel = `${formatDate(start)}, ${new Date(start).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })} WITA`;

  const endLabel = `${formatDate(end)}, ${new Date(end).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })} WITA`;

  if (formatDate(start) === formatDate(end)) {
    return `${formatDate(start)}, ${formatTime(start, end)}`;
  }

  return `${startLabel} - ${endLabel}`;
};

export default function RiwayatPeminjamanPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [latestDraftSnapshot, setLatestDraftSnapshot] = useState<ReservationDraftSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  useEffect(() => {
    const rawDraft = sessionStorage.getItem("reservationDraft");
    if (!rawDraft) {
      return;
    }

    try {
      const parsed = JSON.parse(rawDraft) as ReservationDraftSnapshot;
      setLatestDraftSnapshot(parsed);
    } catch {
      setLatestDraftSnapshot(null);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const fetchReservations = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/reservasi?sort=${sortOrder}`);
        const payload = (await response.json()) as ReservationsResponse | { error?: string };

        if (!response.ok || !("reservations" in payload)) {
          setError((payload as { error?: string }).error || "Gagal memuat data riwayat.");
          setReservations([]);
          return;
        }

        setReservations(payload.reservations);
      } catch {
        setError("Terjadi kesalahan saat memuat data riwayat.");
        setReservations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [status, sortOrder]);

  const latestActiveSubmission = useMemo(
    () => reservations.find((item) => item.res_status === "PENDING") ?? null,
    [reservations]
  );

  const historyItems = useMemo(() => {
    if (!latestActiveSubmission) {
      return reservations;
    }

    return reservations.filter((item) => item.res_id !== latestActiveSubmission.res_id);
  }, [reservations, latestActiveSubmission]);

  const latestPurpose = latestActiveSubmission?.res_purpose || latestDraftSnapshot?.purpose || "-";
  const latestReason = latestDraftSnapshot?.reason || "-";
  const latestDocumentName = latestDraftSnapshot?.documentName || "Belum ada surat pengantar";

  return (
    <div className="min-h-screen bg-[#f5f5f0] font-sans flex flex-col">
      <Navbar />

      <section className="relative flex flex-col justify-end pt-20 pb-10 min-h-56">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-slate-700 via-slate-600 to-slate-800" />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-4">
          <h1 className="text-white text-3xl md:text-4xl font-black tracking-tight">Riwayat Peminjaman</h1>
          <p className="text-white/75 mt-2 text-sm max-w-md">
            Lacak status pengajuan terbaru dan seluruh histori peminjaman ruangan Anda.
          </p>
        </div>
      </section>

      <main className="w-full max-w-5xl mx-auto px-4 md:px-8 pt-8 pb-14 flex-1">
        <nav className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-5 px-1">
          <Link href="/landingpage" className="hover:text-slate-800 flex items-center gap-1 transition-colors">
            <Home size={12} />
            Beranda
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-medium truncate">Riwayat Peminjaman</span>
        </nav>

        <section className="mb-8">
          <h2 className="text-slate-900 text-2xl font-black tracking-tight flex items-center gap-2">
            <FileCheck2 size={20} className="text-slate-700" />
            Status Pengajuan Terkini
          </h2>

          <div className="mt-3 rounded-2xl border border-slate-200 bg-white shadow-md p-4 sm:p-5">
            {loading ? (
              <p className="text-sm text-slate-500">Memuat status pengajuan...</p>
            ) : latestActiveSubmission ? (
              <div className="space-y-4">
                <div>
                  <p className="text-lg font-bold text-slate-900">{latestActiveSubmission.room.room_name}</p>
                  <p className="text-sm text-slate-500">{latestActiveSubmission.room.room_building}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm text-slate-700 flex items-center gap-2">
                    <Calendar size={15} className="text-slate-500" />
                    {formatDateRange(latestActiveSubmission.res_startTime, latestActiveSubmission.res_endTime)}
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm text-slate-700 flex items-center gap-2">
                    <Clock size={15} className="text-slate-500" />
                    {formatTime(latestActiveSubmission.res_startTime, latestActiveSubmission.res_endTime)}
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm text-slate-700 flex items-center gap-2">
                    <Hourglass size={15} className="text-amber-600" />
                    Menunggu Persetujuan
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                  <p className="text-[11px] uppercase tracking-widest font-bold text-slate-500">Detail Data Peminjaman</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                      <p className="text-[11px] text-slate-500 mb-1">Detail Ruangan</p>
                      <p className="font-semibold text-slate-900">{latestActiveSubmission.room.room_name}</p>
                      <p className="text-slate-600 text-xs mt-1">{latestActiveSubmission.room.room_building}</p>
                    </div>

                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                      <p className="text-[11px] text-slate-500 mb-1">Nama Kegiatan</p>
                      <p className="font-semibold text-slate-900">{latestPurpose}</p>
                    </div>

                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 md:col-span-2">
                      <p className="text-[11px] text-slate-500 mb-1">Tujuan Kegiatan</p>
                      <p className="text-slate-800 leading-relaxed">{latestReason}</p>
                    </div>

                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 md:col-span-2">
                      <p className="text-[11px] text-slate-500 mb-2">Surat Pengantar</p>
                      {latestActiveSubmission.res_documentUrl ? (
                        <a
                          href={latestActiveSubmission.res_documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <FileText size={13} />
                          Lihat Surat Pengantar
                        </a>
                      ) : (
                        <p className="text-slate-600 text-xs">{latestDocumentName}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm font-medium text-slate-500">Belum ada pengajuan</p>
            )}
          </div>
        </section>

        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <h2 className="text-slate-900 text-2xl font-black tracking-tight flex items-center gap-2">
              <History size={20} className="text-slate-700" />
              Riwayat Peminjaman
            </h2>

            <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 w-fit">
              <ArrowUpDown size={14} className="text-slate-500" />
              <span>Urutkan</span>
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value as "newest" | "oldest")}
                className="bg-transparent text-sm font-semibold outline-none"
              >
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
              </select>
            </label>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden">
            {loading ? (
              <div className="p-5 text-sm text-slate-500">Memuat riwayat peminjaman...</div>
            ) : error ? (
              <div className="p-5 text-sm text-red-600">{error}</div>
            ) : historyItems.length === 0 ? (
              <div className="p-5 text-sm font-medium text-slate-500">Belum ada riwayat peminjaman</div>
            ) : (
              <>
                <div className="hidden md:grid grid-cols-[2fr_1.1fr_1.2fr_0.9fr_1.4fr] gap-3 bg-slate-50 border-b border-slate-200 px-5 py-3 text-[11px] uppercase tracking-widest font-bold text-slate-500">
                  <span>Ruangan</span>
                  <span>Tanggal</span>
                  <span>Waktu</span>
                  <span>Status</span>
                  <span>Dokumen</span>
                </div>

                <div className="divide-y divide-slate-200">
                  {historyItems.map((item) => {
                    const status = statusMeta[item.res_status] || {
                      label: item.res_status,
                      badge: "bg-slate-100 text-slate-700 border-slate-200",
                      icon: History,
                    };
                    const StatusIcon = status.icon;
                    const decisionDocUrl = item.res_status === "PENDING" ? null : item.res_documentUrl;

                    return (
                      <article key={item.res_id} className="px-4 md:px-5 py-4">
                        <div className="hidden md:grid grid-cols-[2fr_1.1fr_1.2fr_0.9fr_1.4fr] gap-3 items-center">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{item.room.room_name}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                              <Building2 size={12} />
                              {item.room.room_building}
                            </p>
                          </div>

                          <p className="text-sm text-slate-700">{formatDate(item.res_startTime)}</p>
                          <p className="text-sm text-slate-700">{formatTime(item.res_startTime, item.res_endTime)}</p>

                          <span className={`inline-flex w-fit items-center gap-1 border rounded-full px-2.5 py-1 text-xs font-semibold ${status.badge}`}>
                            <StatusIcon size={12} />
                            {status.label}
                          </span>

                          <div className="flex items-center gap-2 text-xs">
                            {item.res_documentUrl ? (
                              <a
                                href={item.res_documentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-50"
                              >
                                <FileText size={12} />
                                Surat Pengajuan
                              </a>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-slate-400">
                                <FileText size={12} />
                                Surat Pengajuan
                              </span>
                            )}

                            {decisionDocUrl ? (
                              <a
                                href={decisionDocUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-50"
                              >
                                <FileCheck2 size={12} />
                                Surat Keputusan
                              </a>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-slate-400">
                                <FileCheck2 size={12} />
                                Surat Keputusan
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="md:hidden space-y-3">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{item.room.room_name}</p>
                            <p className="text-xs text-slate-500">{item.room.room_building}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                            <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">
                              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Tanggal</p>
                              <p>{formatDate(item.res_startTime)}</p>
                            </div>
                            <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">
                              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Waktu</p>
                              <p>{formatTime(item.res_startTime, item.res_endTime)}</p>
                            </div>
                          </div>

                          <span className={`inline-flex w-fit items-center gap-1 border rounded-full px-2.5 py-1 text-xs font-semibold ${status.badge}`}>
                            <StatusIcon size={12} />
                            {status.label}
                          </span>

                          <div className="flex flex-wrap gap-2 text-xs">
                            {item.res_documentUrl ? (
                              <a
                                href={item.res_documentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-slate-700"
                              >
                                <FileText size={12} />
                                Surat Pengajuan
                              </a>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-slate-400">
                                <FileText size={12} />
                                Surat Pengajuan
                              </span>
                            )}
                            {decisionDocUrl ? (
                              <a
                                href={decisionDocUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-slate-700"
                              >
                                <FileCheck2 size={12} />
                                Surat Keputusan
                              </a>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-slate-400">
                                <FileCheck2 size={12} />
                                Surat Keputusan
                              </span>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 py-5 text-center">
        <p className="text-xs text-slate-400">© 2026 FATEK UNSRAT · Website Reservasi Ruangan</p>
      </footer>
    </div>
  );
}
