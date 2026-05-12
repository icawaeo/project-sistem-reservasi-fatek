"use client";

import { useCallback, useMemo } from "react";
import { Calendar, CheckCircle2, Clock, Eye, FileCheck2, FileText, Hourglass } from "lucide-react";

import type { ReservationDraftSnapshot, ReservationRecord } from "./_types";
import { formatDateRange, formatTimeRange } from "../utils/formatters";
import {
  buildDecisionLetterUrl,
  extractActivityName,
  isDecisionLetterReady,
} from "../utils/reservation";

type Props = {
  reservation: ReservationRecord | null;
  draftSnapshot: ReservationDraftSnapshot | null;
};

export default function LatestSubmissionSection({ reservation, draftSnapshot }: Props) {
  const latestPurpose = useMemo(() => {
    const fromReservation = reservation?.res_purpose ? extractActivityName(reservation.res_purpose) : null;
    return fromReservation ?? draftSnapshot?.purpose ?? "-";
  }, [reservation?.res_purpose, draftSnapshot?.purpose]);

  const latestReason = draftSnapshot?.reason ?? "-";
  const latestDocumentName = draftSnapshot?.documentName ?? "Belum ada surat pengantar";

  const decisionLetterUrl = useMemo(() => {
    if (!reservation) return null;
    if (!isDecisionLetterReady(reservation.res_status)) return null;
    return buildDecisionLetterUrl(reservation.res_id);
  }, [reservation]);

  const handlePreviewDocument = useCallback(() => {
    if (!draftSnapshot?.documentDataUrl) return;

    sessionStorage.setItem(
      "previewDocumentData",
      JSON.stringify({
        dataUrl: draftSnapshot.documentDataUrl,
        name: draftSnapshot.documentName ?? "Dokumen",
      })
    );

    window.open("/reservasi/preview", "_blank");
  }, [draftSnapshot]);

  return (
    <section className="mb-8">
      <h2 className="text-slate-900 text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-2">
        <FileCheck2 size={20} className="text-slate-700" />
        Status Pengajuan Terkini
      </h2>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-white shadow-md p-4 sm:p-5">
        {reservation ? (
          <div className="space-y-4">
            <div>
              <p className="text-lg lg:text-xl font-bold text-slate-900">{reservation.room.room_name}</p>
              <p className="text-sm lg:text-base text-slate-500">{reservation.room.room_building}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm lg:text-base text-slate-700 flex items-center gap-2">
                <Calendar size={15} className="text-slate-500" />
                {formatDateRange(reservation.res_startTime, reservation.res_endTime)}
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm lg:text-base text-slate-700 flex items-center gap-2">
                <Clock size={15} className="text-slate-500" />
                {formatTimeRange(reservation.res_startTime, reservation.res_endTime)}
              </div>
              {reservation.res_status === "APPROVED" ? (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm lg:text-base text-slate-700 flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  Disetujui (Berjalan)
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm lg:text-base text-slate-700 flex items-center gap-2">
                  <Hourglass size={15} className="text-amber-600" />
                  Menunggu Persetujuan
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 p-4 space-y-3">
              <p className="text-[11px] lg:text-xs uppercase tracking-widest font-bold text-slate-500">
                Detail Data Peminjaman
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm lg:text-base">
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <p className="text-[11px] lg:text-xs text-slate-500 mb-1">Detail Ruangan</p>
                  <p className="font-semibold text-slate-900">{reservation.room.room_name}</p>
                  <p className="text-slate-600 text-xs lg:text-sm mt-1">{reservation.room.room_building}</p>
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <p className="text-[11px] lg:text-xs text-slate-500 mb-1">Nama Kegiatan</p>
                  <p className="font-semibold text-slate-900">{latestPurpose}</p>
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 md:col-span-2">
                  <p className="text-[11px] lg:text-xs text-slate-500 mb-1">Tujuan Kegiatan</p>
                  <p className="text-slate-800 leading-relaxed">{latestReason}</p>
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <p className="text-[11px] lg:text-xs text-slate-500 mb-2">Surat Pengantar</p>

                  {draftSnapshot?.documentDataUrl ? (
                    <div className="flex items-center gap-3 py-2">
                      <FileText className="text-red-400" size={24} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 text-sm lg:text-base truncate">
                          {latestDocumentName}
                        </div>
                        <div className="text-xs lg:text-sm text-slate-500">Dokumen • Upload</div>
                      </div>
                      <button
                        type="button"
                        onClick={handlePreviewDocument}
                        className="text-slate-700 hover:text-slate-900 transition-colors"
                        title="Preview dokumen"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  ) : reservation.res_documentUrl ? (
                    <a
                      href={reservation.res_documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs lg:text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <FileText size={13} />
                      Lihat Surat Pengantar
                    </a>
                  ) : (
                    <p className="text-slate-600 text-xs lg:text-sm">{latestDocumentName}</p>
                  )}
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <p className="text-[11px] lg:text-xs text-slate-500 mb-2">Surat Keputusan</p>
                  {decisionLetterUrl ? (
                    <a
                      href={decisionLetterUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs lg:text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <FileCheck2 size={13} />
                      Lihat Surat Keputusan
                    </a>
                  ) : (
                    <p className="text-slate-600 text-xs lg:text-sm">Surat keputusan belum tersedia</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm lg:text-base font-medium text-slate-500">Belum ada pengajuan</p>
        )}
      </div>
    </section>
  );
}
