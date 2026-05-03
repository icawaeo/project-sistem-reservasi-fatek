"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useToast } from "@/app/components/ui/toast";
import type { MonitoringReservation } from "./monitoring-types";
import StatusBadge from "@/app/components/administrator/superadmin/ui/StatusBadge";
import MonitoringDetailModal from "./MonitoringDetailModal";
import DeleteConfirmationModal from "@/app/components/administrator/superadmin/ui/DeleteConfirmationModal";
import { computeReservationStatus, resolveReservationStatusGroup } from "@/app/components/administrator/common/reservationStatus";

const PAGE_SIZE = 10;

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

type TableMonitoringProps = {
  data: MonitoringReservation[];
  sortOrder?: "newest" | "oldest";
  filterStatus?: "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  onSortOrderChange?: (value: "newest" | "oldest") => void;
  onFilterStatusChange?: (value: "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED") => void;
  onDeleteSuccess?: (deletedId: string) => void;
  showControls?: boolean;
  showDelete?: boolean;
};

export default function TableMonitoring({
  data,
  sortOrder,
  filterStatus,
  onSortOrderChange,
  onFilterStatusChange,
  onDeleteSuccess,
  showControls = true,
  showDelete = true,
}: TableMonitoringProps) {
  const { pushToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [tableData, setTableData] = useState<MonitoringReservation[]>(data);
  const [selectedRow, setSelectedRow] = useState<MonitoringReservation | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; item: MonitoringReservation | null }>({
    isOpen: false,
    item: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [internalSortOrder, setInternalSortOrder] = useState<"newest" | "oldest">("newest");
  const [internalFilterStatus, setInternalFilterStatus] = useState<
    "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED"
  >("ALL");

  const activeSortOrder = sortOrder ?? internalSortOrder;
  const activeFilterStatus = filterStatus ?? internalFilterStatus;

  useEffect(() => {
    setTableData(data);
  }, [data]);

  const filteredAndSortedData = useMemo(() => {
    const filtered =
      activeFilterStatus === "ALL"
        ? tableData
        : tableData.filter((item) => {
            const computed = computeReservationStatus(item.status, item.endTime);
            return resolveReservationStatusGroup(computed) === activeFilterStatus;
          });

    return [...filtered].sort((a, b) => {
      const left = new Date(a.createdAt).getTime();
      const right = new Date(b.createdAt).getTime();
      return activeSortOrder === "newest" ? right - left : left - right;
    });
  }, [tableData, activeFilterStatus, activeSortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilterStatus, activeSortOrder]);

  const handleSortOrderChange = (value: "newest" | "oldest") => {
    if (onSortOrderChange) {
      onSortOrderChange(value);
      return;
    }
    setInternalSortOrder(value);
  };

  const handleFilterStatusChange = (value: "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED") => {
    if (onFilterStatusChange) {
      onFilterStatusChange(value);
      return;
    }
    setInternalFilterStatus(value);
  };

  const handleDeleteClick = (item: MonitoringReservation) => {
    setDeleteModal({
      isOpen: true,
      item,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.item) return;

    const deletedId = deleteModal.item.id;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/reservasi/delete?id=${deletedId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal menghapus pengajuan");
      }

      setTableData((prev) => prev.filter((item) => item.id !== deletedId));
      setSelectedRow((prev) => (prev?.id === deletedId ? null : prev));

      // Call parent callback to refetch data
      onDeleteSuccess?.(deletedId);

      // Close modal
      setDeleteModal({ isOpen: false, item: null });

      pushToast({ type: "success", message: "Pengajuan berhasil dihapus." });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, item: null });
  };

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

  return (
    <>
      {showControls ? (
        <div className="mb-3 flex flex-row flex-wrap items-center gap-2">
        <label className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
          <ArrowUpDown size={14} className="text-slate-500" />
          <span>Urutkan</span>
          <select
            value={activeSortOrder}
            onChange={(event) => handleSortOrderChange(event.target.value as "newest" | "oldest")}
            className="bg-transparent text-sm font-semibold outline-none"
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
          </select>
        </label>

        <label className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
          <span>Filter Status</span>
          <select
            value={activeFilterStatus}
            onChange={(event) =>
              handleFilterStatusChange(
                event.target.value as "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED"
              )
            }
            className="bg-transparent text-sm font-semibold outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Menunggu</option>
            <option value="APPROVED">Disetujui</option>
            <option value="COMPLETED">Selesai</option>
            <option value="REJECTED">Ditolak</option>
          </select>
        </label>
        </div>
      ) : null}

      {/* Desktop table view */}
      <div className="hidden lg:block overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-275 w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50">
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Nama Lengkap</th>
                <th className="px-4 py-3">Nama Kegiatan</th>
                <th className="px-4 py-3">Tujuan Peminjaman</th>
                <th className="px-4 py-3">Tanggal Peminjaman</th>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Ruangan</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Detail</th>
                {showDelete ? <th className="px-4 py-3 text-center">Aksi</th> : <th className="px-4 py-3 text-center">Detail</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((item, index) => (
                  <tr key={item.id} className="border-t border-slate-100 text-slate-700">
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {(currentPage - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{item.user.name}</td>
                    <td className="px-4 py-3">{item.activityName}</td>
                    <td className="px-4 py-3">{item.purpose}</td>
                    <td className="px-4 py-3">{formatDate(item.startTime)}</td>
                    <td className="px-4 py-3">
                      {formatTime(item.startTime)} - {formatTime(item.endTime)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{item.room.name}</p>
                      <p className="text-xs text-slate-500">{item.room.building}</p>
                    </td>
                      <td className="px-2 py-3 text-center align-middle">
                        <div className="flex w-full justify-center">
                          <StatusBadge status={computeReservationStatus(item.status, item.endTime)} />
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center align-middle">
                        <div className="flex w-full justify-center">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedRow({
                                ...item,
                                status: computeReservationStatus(item.status, item.endTime),
                              })
                            }
                            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            Lihat Detail
                          </button>
                        </div>
                      </td>
                      {showDelete ? (
                        <td className="px-2 py-3 text-center align-middle">
                          <div className="flex w-full justify-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(item)}
                              className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-600 transition-colors hover:bg-rose-100"
                              title="Hapus Data Pengajuan"
                              aria-label={`Hapus pengajuan ${item.activityName}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      ) : null}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={showDelete ? 10 : 9} className="px-4 py-10 text-center text-sm text-slate-500">
                    Belum ada data pengajuan terbaru.
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

      {/* Mobile card view */}
      <div className="lg:hidden space-y-3">
        {paginatedData.length > 0 ? (
          paginatedData.map((item) => (
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
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tujuan</p>
                  <p className="text-sm text-slate-700">{item.purpose}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ruangan</p>
                  <p className="text-sm font-semibold text-slate-900">{item.room.name}</p>
                  <p className="text-xs text-slate-500">{item.room.building}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tanggal &amp; Waktu</p>
                  <p className="text-sm text-slate-700">{formatDate(item.startTime)}</p>
                  <p className="text-xs text-slate-500">{formatTime(item.startTime)} - {formatTime(item.endTime)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                  <div className="mt-1">
                    <StatusBadge status={computeReservationStatus(item.status, item.endTime)} />
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-200 p-4 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedRow({
                      ...item,
                      status: computeReservationStatus(item.status, item.endTime),
                    })
                  }
                  className="flex-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                >
                  Lihat Detail
                </button>
                {showDelete ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(item)}
                    className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-600 transition-colors hover:bg-rose-100"
                    title="Hapus Data Pengajuan"
                    aria-label={`Hapus pengajuan ${item.activityName}`}
                  >
                    <Trash2 size={16} />
                  </button>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center">
            <p className="text-sm text-slate-500">Belum ada data pengajuan terbaru.</p>
          </div>
        )}
      </div>

      <MonitoringDetailModal data={selectedRow} onClose={() => setSelectedRow(null)} />
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Hapus Data Pengajuan"
        description={`Data pengajuan "${deleteModal.item?.activityName}" akan dihapus.`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={isDeleting}
      />
    </>
  );
}