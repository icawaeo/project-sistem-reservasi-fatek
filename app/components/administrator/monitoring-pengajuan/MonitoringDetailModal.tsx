"use client";

import { X, FileText } from "lucide-react";
import type { MonitoringReservation } from "./monitoring-types";
import StatusBadge from "../ui/StatusBadge";

type MonitoringDetailModalProps = {
  data: MonitoringReservation | null;
  onClose: () => void;
};

function formatDate(dateInput: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(dateInput));
}

function formatDateRange(startDateInput: string, endDateInput: string) {
  const startLabel = formatDate(startDateInput);
  const endLabel = formatDate(endDateInput);
  return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
}

function formatTime(dateInput: string) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateInput));
}

export default function MonitoringDetailModal({
  data,
  onClose,
}: MonitoringDetailModalProps) {
  if (!data) {
    return null;
  }



  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-500">Detail Pengajuan</p>
            <h3 className="text-lg font-bold text-slate-900">{data.activityName}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5 text-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nama User</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{data.user.name}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">NIM / NIP</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{data.user.identifier || "-"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tanggal Kegiatan</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{formatDateRange(data.startTime, data.endTime)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Waktu</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatTime(data.startTime)} - {formatTime(data.endTime)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ruangan</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{data.room.name}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gedung</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{data.room.building}</p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Data Kegiatan</p>
            <div className="mt-2 space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Nama Kegiatan</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{data.activityName}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tujuan Kegiatan</p>
                <p className="mt-1 text-sm text-slate-700">{data.purpose}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status Pengajuan</p>
              <div className="mt-1">
                <StatusBadge status={data.status} />
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {data.documentUrl ? (
                <a
                  href={data.documentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  <FileText size={14} />
                  Surat Pengantar
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-500"
                >
                  <FileText size={14} />
                  Surat Pengantar Belum Ada
                </button>
              )}

              {data.decisionDocumentUrl ? (
                <a
                  href={data.decisionDocumentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <FileText size={14} />
                  Surat Keputusan
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-500"
                >
                  <FileText size={14} />
                  Surat Keputusan Belum Ada
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
