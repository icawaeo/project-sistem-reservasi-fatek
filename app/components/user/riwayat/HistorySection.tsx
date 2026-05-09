"use client";

import { type ComponentType } from "react";
import {
  ArrowUpDown,
  CheckCircle2,
  FileCheck2,
  FileText,
  History,
  Hourglass,
  XCircle,
} from "lucide-react";

import type { ReservationRecord, ReservationStatus, SortOrder } from "./_types";
import { formatDate, formatTimeRange } from "../utils/formatters";
import {
  buildDecisionLetterUrl,
  extractActivityName,
  isDecisionLetterReady,
} from "../utils/reservation";

type FilterStatus = "ALL" | ReservationStatus;

type StatusMeta = {
  label: string;
  badge: string;
  icon: ComponentType<{ size?: number; className?: string }>;
};

const statusMeta: Record<string, StatusMeta> = {
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

type Props = {
  items: ReservationRecord[];
  sortOrder: SortOrder;
  filterStatus: FilterStatus;
  onSortOrderChange: (value: SortOrder) => void;
  onFilterStatusChange: (value: FilterStatus) => void;
};

export default function HistorySection({
  items,
  sortOrder,
  filterStatus,
  onSortOrderChange,
  onFilterStatusChange,
}: Props) {
  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <h2 className="text-slate-900 text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-2">
          <History size={20} className="text-slate-700" />
          Riwayat Peminjaman
        </h2>

        <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 no-scrollbar sm:w-auto sm:justify-end">
          <label className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs md:text-sm lg:text-base text-slate-700">
            <ArrowUpDown size={14} className="text-slate-500" />
            <span>Urutkan</span>
            <select
              value={sortOrder}
              onChange={(event) => onSortOrderChange(event.target.value as SortOrder)}
              className="bg-transparent text-xs md:text-sm lg:text-base font-semibold outline-none"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
            </select>
          </label>

          <label className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs md:text-sm lg:text-base text-slate-700">
            <span>Filter Status</span>
            <select
              value={filterStatus}
              onChange={(event) => onFilterStatusChange(event.target.value as FilterStatus)}
              className="bg-transparent text-xs md:text-sm lg:text-base font-semibold outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING">Menunggu</option>
              <option value="APPROVED">Disetujui</option>
              <option value="REJECTED">Ditolak</option>
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden">
        {items.length === 0 ? (
          <div className="p-5 text-sm lg:text-base font-medium text-slate-500">Belum ada riwayat peminjaman</div>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-[1.5fr_1.5fr_1.1fr_1.2fr_0.9fr_1.4fr] gap-3 bg-slate-50 border-b border-slate-200 px-5 py-3 text-[11px] lg:text-xs uppercase tracking-widest font-bold text-slate-500">
              <span>Nama Kegiatan</span>
              <span>Ruangan</span>
              <span>Tanggal</span>
              <span>Waktu</span>
              <span>Status</span>
              <span>Dokumen</span>
            </div>

            <div className="divide-y divide-slate-200">
              {items.map((item) => {
                const status = statusMeta[item.res_status] || {
                  label: item.res_status,
                  badge: "bg-slate-100 text-slate-700 border-slate-200",
                  icon: History,
                };
                const StatusIcon = status.icon;

                const decisionDocUrl = isDecisionLetterReady(item.res_status)
                  ? buildDecisionLetterUrl(item.res_id)
                  : null;

                return (
                  <article key={item.res_id} className="px-4 md:px-5 py-4">
                    <div className="hidden md:grid grid-cols-[1.5fr_1.5fr_1.1fr_1.2fr_0.9fr_1.4fr] gap-3 items-center">
                      <p className="text-sm lg:text-base font-bold text-slate-900 text-left">
                        {extractActivityName(item.res_purpose)}
                      </p>

                      <div className="text-left">
                        <p className="text-sm lg:text-base font-bold text-slate-900">{item.room.room_name}</p>
                        <p className="text-xs lg:text-sm text-slate-500 flex items-center gap-1 mt-1">
                          {item.room.room_building}
                        </p>
                      </div>

                      <p className="text-sm lg:text-base text-slate-700 text-center">{formatDate(item.res_startTime)}</p>
                      <p className="text-sm lg:text-base text-slate-700 text-center">
                        {formatTimeRange(item.res_startTime, item.res_endTime)}
                      </p>

                      <span
                        className={`inline-flex w-fit items-center gap-1 border rounded-full px-2.5 py-1 text-xs lg:text-sm font-semibold justify-center mx-auto ${status.badge}`}
                      >
                        <StatusIcon size={12} />
                        {status.label}
                      </span>

                      <div className="flex items-center justify-center gap-2 text-xs lg:text-sm">
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
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900">{item.room.room_name}</p>
                          <p className="text-xs text-slate-500">{item.room.room_building}</p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 border rounded-full px-2.5 py-1 text-xs font-semibold ${status.badge}`}
                        >
                          <StatusIcon size={12} />
                          {status.label}
                        </span>
                      </div>

                      <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Nama Kegiatan</p>
                        <p className="text-xs font-bold text-slate-900">{extractActivityName(item.res_purpose)}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 text-center">
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Tanggal</p>
                          <p>{formatDate(item.res_startTime)}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 text-center">
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Waktu</p>
                          <p>{formatTimeRange(item.res_startTime, item.res_endTime)}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs justify-center">
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
  );
}
