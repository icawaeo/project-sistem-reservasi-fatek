"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import TableMonitoring from "./TableMonitoring";
import type { MonitoringReservation } from "./types";

type MonitoringSectionProps = {
  data: MonitoringReservation[];
  lastSync: string;
  primaryStatusLabel: string;
  headerAction?: ReactNode;
  onDeleteSuccess?: (deletedId: string) => void;
};

export default function MonitoringSection({
  data,
  lastSync,
  primaryStatusLabel,
  headerAction,
  onDeleteSuccess,
}: MonitoringSectionProps) {
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED"
  >("ALL");

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 lg:p-5">
      <div className="mb-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Monitoring Pengajuan Terbaru</h2>
            <p className="text-sm text-slate-500">
              Data reservasi terbaru tanpa aksi approve/reject. Fokus monitoring status.
            </p>
            {/* <p className="mt-1 text-xs text-slate-400">Last Sync: {lastSync} WITA</p> */}
          </div>

          {headerAction ? <div className="hidden shrink-0 lg:block">{headerAction}</div> : null}
        </div>

        <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-row lg:items-center">
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-700 lg:w-fit lg:px-3">
            <ArrowUpDown size={14} className="shrink-0 text-slate-500" />
            <span className="whitespace-nowrap">Urutkan</span>
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as "newest" | "oldest")}
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none lg:flex-none"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
            </select>
          </label>

          <label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-700 lg:w-fit lg:px-3">
            <span className="whitespace-nowrap">Filter</span>
            <select
              value={filterStatus}
              onChange={(event) =>
                setFilterStatus(event.target.value as "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED")
              }
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none lg:flex-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING">Menunggu</option>
              <option value="APPROVED">Disetujui</option>
              <option value="COMPLETED">Selesai</option>
              <option value="REJECTED">Ditolak</option>
            </select>
          </label>

          {/* <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
            Status utama: {primaryStatusLabel}
          </span> */}
        </div>

        {headerAction ? (
          <div className="block lg:hidden">{headerAction}</div>
        ) : null}
      </div>

      <TableMonitoring
        data={data}
        sortOrder={sortOrder}
        filterStatus={filterStatus}
        onSortOrderChange={setSortOrder}
        onFilterStatusChange={setFilterStatus}
        onDeleteSuccess={onDeleteSuccess}
        showControls={false}
      />
    </section>
  );
}
