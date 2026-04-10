"use client";

import { FileText, X } from "lucide-react";

import type { AdminReservationRecord, AdminRole } from "./types";
import StatusUsulan from "./StatusUsulan";

type AdminReservationDetailModalProps = {
  data: AdminReservationRecord | null;
  adminRole: AdminRole;
  isActionable: boolean;
  isBusy: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
};

function formatDateTime(dateInput: string) {
  const date = new Date(dateInput);
  const dateLabel = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);

  const timeLabel = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return `${dateLabel} • ${timeLabel}`;
}

function formatDate(dateInput: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(dateInput));
}

function formatTime(dateInput: string) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateInput));
}

const extractFilename = (url: string) => {
  try {
    const parsed = new URL(url);
    const name = parsed.pathname.split("/").filter(Boolean).pop();
    return name || "surat_pengantar.pdf";
  } catch {
    const raw = url.split("?")[0];
    const name = raw.split("/").filter(Boolean).pop();
    return name || "surat_pengantar.pdf";
  }
};

export default function AdminReservationDetailModal({
  data,
  adminRole,
  isActionable,
  isBusy,
  onClose,
  onApprove,
  onReject,
}: AdminReservationDetailModalProps) {
  if (!data) return null;

  const applicantSubtitle = data.user.userType === "PUBLIC" ? "Umum" : data.user.userType === "STAFF" ? "Staff" : "Mahasiswa";
  const purposeLabel = data.purpose && data.purpose !== "-" ? data.purpose : data.rawPurpose;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-500">Detail Pengajuan</p>
            <h3 className="text-lg font-bold text-slate-900">{data.activityName}</h3>
            <p className="mt-0.5 text-xs text-slate-500">Role Anda: {adminRole.replace("ADMIN_", "Admin ")}</p>
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

        <div className="space-y-4 px-5 py-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-600">Applicant Info</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                    {(data.user.name || "U").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{data.user.name}</p>
                    <p className="truncate text-xs text-slate-500">{applicantSubtitle}</p>
                    <p className="truncate text-xs text-slate-500">{data.user.email}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-600">Activity Details</p>
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Nama Kegiatan</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{data.activityName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Tujuan Peminjaman</p>
                    <p className="mt-1 text-sm text-slate-700">{purposeLabel || "-"}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-600">Reservation Date</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">{formatDate(data.startTime)}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatTime(data.startTime)} - {formatTime(data.endTime)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-600">Submitted At</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">{formatDateTime(data.createdAt)}</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-600">Status Usulan</p>
                <div className="mt-3">
                  <StatusUsulan status={data.status} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-600">Location & Specs</p>
                    <p className="mt-2 text-base font-black tracking-tight text-slate-900">{data.room.name}</p>
                    <p className="text-sm text-slate-500">{data.room.building}</p>
                    <p className="mt-1 text-xs text-slate-500">{data.room.location || "-"}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-600">Supporting Documents</p>

                <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1.25fr]">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    {data.documentUrl ? (
                      <a
                        href={data.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                            <FileText size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-900">{extractFilename(data.documentUrl)}</p>
                            <p className="text-[11px] text-slate-500">Klik untuk membuka PDF</p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-slate-600">Buka</span>
                      </a>
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-white p-3">
                        <p className="text-xs font-semibold text-slate-700">Tidak ada surat pengantar</p>
                        <p className="mt-1 text-[11px] text-slate-500">User belum mengunggah surat pengantar.</p>
                      </div>
                    )}
                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {data.documentUrl ? (
                      <iframe
                        title="Preview Surat Pengantar"
                        src={data.documentUrl}
                        className="h-72 w-full bg-white"
                      />
                    ) : (
                      <div className="flex h-72 items-center justify-center bg-slate-50 px-6 text-center">
                        <div>
                          <p className="text-sm font-semibold text-slate-700">Preview tidak tersedia</p>
                          <p className="mt-1 text-xs text-slate-500">Surat pengantar belum diunggah.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Tutup
            </button>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onReject}
                disabled={!isActionable || isBusy}
                className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Tolak Pengajuan
              </button>
              <button
                type="button"
                onClick={onApprove}
                disabled={!isActionable || isBusy}
                className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Setujui Pengajuan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
