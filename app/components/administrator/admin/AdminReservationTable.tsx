"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Eye } from "lucide-react";

import {
  computeReservationStatus,
} from "@/app/components/administrator/reservations/reservationStatus";
import { useToast } from "@/app/components/ui/toast";
import AdminReservationDetailModal from "@/app/components/administrator/admin/AdminReservationDetailModal";
import PaginationBar from "@/app/components/administrator/common/PaginationBar";
import ToolbarSelect from "@/app/components/administrator/common/ToolbarSelect";
import { getPaginationItems } from "@/app/components/administrator/common/pagination";
import { formatDateIdShort, formatTimeIdShort } from "@/app/components/administrator/common/datetime";
import type { AdminReservationRecord, AdminRole } from "./types";

const PAGE_SIZE = 5;

type FilterStatus = "ALL" | "SUBMITTED" | "WAITING_APPROVAL" | "APPROVED" | "REJECTED" | "COMPLETED";

type AdminReservationTableProps = {
  data: AdminReservationRecord[];
  adminRole: AdminRole;
  onStatusUpdated: (id: string, updates: Partial<AdminReservationRecord>) => void;
};

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

  if (role === "KAJUR") {
    return normalized === "PENDING_KAJUR";
  }

  if (role === "KEPALA_LAB") {
    return normalized === "PENDING_KEPALA_LAB";
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
    return getPaginationItems(currentPage, totalPages);
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
        waitingKajurAt?: string | null;
        waitingKepalaLabAt?: string | null;
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
        waitingKajurAt: payload.waitingKajurAt ?? null,
        waitingKepalaLabAt: payload.waitingKepalaLabAt ?? null,
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
      <div className="flex flex-row flex-wrap items-center gap-2">
        <ToolbarSelect
          label="Urutkan"
          value={sortOrder}
          onChange={setSortOrder}
          prefix={<ArrowUpDown size={14} className="text-slate-500" />}
          options={[
            { value: "newest", label: "Terbaru" },
            { value: "oldest", label: "Terlama" },
          ]}
        />

        <ToolbarSelect
          label="Filter Status"
          value={filterStatus}
          onChange={(value) => setFilterStatus(value as FilterStatus)}
          options={[
            { value: "ALL", label: "Semua Status" },
            { value: "SUBMITTED", label: "Diajukan" },
            { value: "WAITING_APPROVAL", label: "Menunggu Persetujuan" },
            { value: "APPROVED", label: "Disetujui" },
            { value: "REJECTED", label: "Ditolak" },
            { value: "COMPLETED", label: "Selesai" },
          ]}
        />
      </div>

      {/* Desktop table view */}
      <div className="hidden lg:block overflow-hidden rounded-xl border border-slate-200 bg-white">
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
                        <p className="font-semibold text-slate-900">{formatDateIdShort(item.startTime)}</p>
                        <p className="text-xs text-slate-500">
                          {formatTimeIdShort(item.startTime)} - {formatTimeIdShort(item.endTime)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{item.room.name}</p>
                        <p className="text-xs text-slate-500">{item.room.building}</p>
                      </td>
                      <td className="w-32 px-3 py-3 text-xs text-slate-600">
                        <p className="whitespace-nowrap">{formatDateIdShort(item.createdAt)}</p>
                        <p className="whitespace-nowrap">{formatTimeIdShort(item.createdAt)}</p>
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

        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          pageItems={pageItems}
          onPageChange={setCurrentPage}
          summary={
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Menampilkan {paginatedData.length} dari {filteredAndSortedData.length} data
            </span>
          }
        />
      </div>
    </div>

    {/* Mobile card view */}
    <div className="lg:hidden space-y-3">
      {paginatedData.length > 0 ? (
        paginatedData.map((item, index) => {
          const isBusy = processing?.id === item.id;
          return (
            <div key={item.id} className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="flex-1 p-4 space-y-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nama Pengaju</p>
                  <p className="text-sm font-semibold text-slate-900">{item.user.name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kegiatan</p>
                  <p className="text-sm text-slate-700">{item.activityName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ruangan</p>
                  <p className="text-sm font-semibold text-slate-900">{item.room.name}</p>
                  <p className="text-xs text-slate-500">{item.room.building}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tanggal Peminjaman</p>
                  <p className="text-sm text-slate-700">{formatDateIdShort(item.startTime)}</p>
                  <p className="text-xs text-slate-500">
                    {formatTimeIdShort(item.startTime)} - {formatTimeIdShort(item.endTime)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tanggal Pengajuan</p>
                  <p className="text-sm text-slate-700">{formatDateIdShort(item.createdAt)}</p>
                  <p className="text-xs text-slate-500">{formatTimeIdShort(item.createdAt)}</p>
                </div>
              </div>
              <div className="border-t border-slate-200 p-4">
                <button
                  type="button"
                  onClick={() => setSelectedRow(item)}
                  disabled={isBusy}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:-translate-y-0.5 hover:bg-slate-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Eye size={16} />
                  Tinjau &amp; Proses
                </button>
              </div>
            </div>
          );
        })
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center">
          <p className="text-sm text-slate-500">Belum ada data pengajuan.</p>
        </div>
      )}
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
