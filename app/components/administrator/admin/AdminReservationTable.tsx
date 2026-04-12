"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight, Eye } from "lucide-react";

import {
  computeReservationStatus,
} from "@/app/components/administrator/superadmin/reservationStatus";
import { useToast } from "@/app/components/ui/toast";
import AdminReservationDetailModal from "@/app/components/administrator/admin/AdminReservationDetailModal";
import type { AdminReservationRecord, AdminRole } from "./types";

const PAGE_SIZE = 5;

type FilterStatus = "ALL" | "SUBMITTED" | "WAITING_APPROVAL" | "APPROVED" | "REJECTED" | "COMPLETED";

type AdminReservationTableProps = {
  data: AdminReservationRecord[];
  adminRole: AdminRole;
  onStatusUpdated: (id: string, updates: Partial<AdminReservationRecord>) => void;
};

function formatDate(dateInput: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateInput));
}

function formatTime(dateInput: string) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateInput));
}

function resolveAdminFilterStatusGroup(status: string, endTimeInput: string): Exclude<FilterStatus, "ALL"> {
  const computed = computeReservationStatus(status, endTimeInput);
  const normalized = (computed ?? "").toUpperCase();

  if (normalized === "COMPLETED" || normalized === "SELESAI") return "COMPLETED";
  if (normalized.startsWith("REJECT") || normalized.includes("DITOLAK")) return "REJECTED";
  if (normalized === "APPROVED" || normalized === "DISETUJUI") return "APPROVED";
  if (normalized === "PENDING" || normalized === "PENDING_KABAG") return "SUBMITTED";
  if (normalized.startsWith("PENDING") || normalized.includes("MENUNGGU")) return "WAITING_APPROVAL";

  return "WAITING_APPROVAL";
}

function isActionableStatusForRole(role: AdminRole, status: string) {
  const normalized = (status ?? "").toUpperCase();

  if (normalized === "COMPLETED" || normalized === "APPROVED" || normalized === "DISETUJUI") return false;
  if (normalized.startsWith("REJECT")) return false;

  if (role === "ADMIN") {
    return normalized === "PENDING" || normalized === "PENDING_KABAG";
  }

  if (role === "ADMIN_DEKAN") {
    return normalized === "PENDING_DEKAN";
  }

  if (role === "ADMIN_WD2") {
    return normalized === "PENDING_WD2" || normalized === "PENDING_WAKIL_DEKAN_2";
  }

  return false;
}

export default function AdminReservationTable({ data, adminRole, onStatusUpdated }: AdminReservationTableProps) {
  const { pushToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [processing, setProcessing] = useState<{ id: string; action: "APPROVE" | "REJECT" } | null>(null);
  const [selectedRow, setSelectedRow] = useState<AdminReservationRecord | null>(null);

  const filteredAndSortedData = useMemo(() => {
    const filtered =
      filterStatus === "ALL"
        ? data
        : data.filter((item) => {
            return resolveAdminFilterStatusGroup(item.status, item.endTime) === filterStatus;
          });

    return [...filtered].sort((a, b) => {
      const left = new Date(a.createdAt).getTime();
      const right = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? right - left : left - right;
    });
  }, [data, filterStatus, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedData.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAndSortedData.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredAndSortedData]);

  const pageItems = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const items: Array<number | "ellipsis-left" | "ellipsis-right"> = [1];
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 3) {
      start = 2;
      end = 4;
    }

    if (currentPage >= totalPages - 2) {
      start = totalPages - 3;
      end = totalPages - 1;
    }

    if (start > 2) {
      items.push("ellipsis-left");
    }

    for (let page = start; page <= end; page += 1) {
      items.push(page);
    }

    if (end < totalPages - 1) {
      items.push("ellipsis-right");
    }

    items.push(totalPages);
    return items;
  }, [currentPage, totalPages]);

  const handleDecision = async (id: string, action: "APPROVE" | "REJECT") => {
    if (processing) return;

    setProcessing({ id, action });

    try {
      const response = await fetch(`/api/admin/reservations/${id}/decision`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const payload = (await response.json()) as {
        status?: string;
        processedAt?: string;
        waitingDekanAt?: string | null;
        waitingWd2At?: string | null;
        decisionAt?: string | null;
        error?: string;
      };

      if (!response.ok || !payload.status) {
        throw new Error(payload.error || "Gagal memproses pengajuan");
      }

      const updates: Partial<AdminReservationRecord> = {
        status: payload.status,
        processedAt: payload.processedAt ?? null,
        waitingDekanAt: payload.waitingDekanAt ?? null,
        waitingWd2At: payload.waitingWd2At ?? null,
        decisionAt: payload.decisionAt ?? null,
      };

      onStatusUpdated(id, updates);
      setSelectedRow((prev) => (prev && prev.id === id ? { ...prev, ...updates } : prev));
      pushToast({
        type: "success",
        message: action === "APPROVE" ? "Pengajuan berhasil disetujui." : "Pengajuan berhasil ditolak.",
      });
    } catch (error) {
      pushToast({
        type: "error",
        message: error instanceof Error ? error.message : "Terjadi kesalahan saat memproses.",
      });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <>
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
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

        <label className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
          <span>Filter Status</span>
          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value as FilterStatus)}
            className="bg-transparent text-sm font-semibold outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="SUBMITTED">Diajukan</option>
            <option value="WAITING_APPROVAL">Menunggu Persetujuan</option>
            <option value="APPROVED">Disetujui</option>
            <option value="REJECTED">Ditolak</option>
            <option value="COMPLETED">Selesai</option>
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-275 w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50">
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Nama Lengkap</th>
                <th className="px-4 py-3">Nama Kegiatan</th>
                <th className="w-40 px-3 py-3">Tanggal &amp; Waktu Peminjaman</th>
                <th className="px-4 py-3">Ruangan</th>
                <th className="w-32 px-3 py-3">Tanggal &amp; Waktu Pengajuan</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((item, index) => {
                  const isBusy = processing?.id === item.id;

                  return (
                    <tr key={item.id} className="border-t border-slate-100 text-slate-700">
                      <td className="px-4 py-3 text-xs text-slate-500">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{item.user.name}</td>
                      <td className="px-4 py-3">{item.activityName}</td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-slate-900">{formatDate(item.startTime)}</p>
                        <p className="text-xs text-slate-500">
                          {formatTime(item.startTime)} - {formatTime(item.endTime)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{item.room.name}</p>
                        <p className="text-xs text-slate-500">{item.room.building}</p>
                      </td>
                      <td className="w-32 px-3 py-3 text-xs text-slate-600">
                        <p className="whitespace-nowrap">{formatDate(item.createdAt)}</p>
                        <p className="whitespace-nowrap">{formatTime(item.createdAt)}</p>
                      </td>
                      <td className="px-2 py-3 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => setSelectedRow(item)}
                          disabled={isBusy}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-slate-800 bg-slate-800 px-3 py-2 text-xs font-semibold text-white transition-all duration-150 hover:-translate-y-0.5 hover:bg-slate-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Eye size={14} />
                          Tinjau &amp; Proses
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    Belum ada data pengajuan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Menampilkan {paginatedData.length} dari {filteredAndSortedData.length} data
          </span>

          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>

            {pageItems.map((item, index) => {
              if (typeof item !== "number") {
                return (
                  <span key={`${item}-${index}`} className="px-1 text-slate-400">
                    ...
                  </span>
                );
              }

              const isActive = item === currentPage;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCurrentPage(item)}
                  className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 font-semibold transition-colors ${
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                  aria-label={`Halaman ${item}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Halaman berikutnya"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>

    <AdminReservationDetailModal
      data={selectedRow}
      adminRole={adminRole}
      isActionable={selectedRow ? isActionableStatusForRole(adminRole, selectedRow.status) : false}
      isBusy={Boolean(selectedRow && processing?.id === selectedRow.id)}
      onClose={() => setSelectedRow(null)}
      onApprove={() => {
        if (!selectedRow) return;
        handleDecision(selectedRow.id, "APPROVE");
      }}
      onReject={() => {
        if (!selectedRow) return;
        handleDecision(selectedRow.id, "REJECT");
      }}
    />
    </>
  );
}
