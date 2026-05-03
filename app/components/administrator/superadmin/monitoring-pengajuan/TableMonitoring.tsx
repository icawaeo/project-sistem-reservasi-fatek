"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Trash2 } from "lucide-react";
import { useToast } from "@/app/components/ui/toast";
import type { MonitoringReservation } from "./monitoring-types";
import StatusBadge from "../ui/StatusBadge";
import MonitoringDetailModal from "./MonitoringDetailModal";
import DeleteConfirmationModal from "../ui/DeleteConfirmationModal";
import {
  computeReservationStatus,
  resolveReservationStatusGroup,
} from "@/app/components/administrator/common/reservationStatus";
import PaginationBar from "@/app/components/administrator/common/PaginationBar";
import ToolbarSelect from "@/app/components/administrator/common/ToolbarSelect";
import { getPaginationItems } from "@/app/components/administrator/common/pagination";
import { formatDateIdShort, formatTimeIdShort } from "@/app/components/administrator/common/datetime";

const PAGE_SIZE = 10;

type TableMonitoringProps = {
  data: MonitoringReservation[];
  sortOrder?: "newest" | "oldest";
  filterStatus?: "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  onSortOrderChange?: (value: "newest" | "oldest") => void;
  onFilterStatusChange?: (value: "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED") => void;
  onDeleteSuccess?: (deletedId: string) => void;
  showControls?: boolean;
};

export default function TableMonitoring({
  data,
  sortOrder,
  filterStatus,
  onSortOrderChange,
  onFilterStatusChange,
  onDeleteSuccess,
  showControls = true,
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
    return getPaginationItems(currentPage, totalPages);
  }, [currentPage, totalPages]);

  return (
    <>
      {showControls ? (
        <div className="mb-3 flex flex-row flex-wrap items-center gap-2">
          <ToolbarSelect
            label="Urutkan"
            value={activeSortOrder}
            onChange={handleSortOrderChange}
            prefix={<ArrowUpDown size={14} className="text-slate-500" />}
            options={[
              { value: "newest", label: "Terbaru" },
              { value: "oldest", label: "Terlama" },
            ]}
          />

          <ToolbarSelect
            label="Filter Status"
            value={activeFilterStatus}
            onChange={handleFilterStatusChange}
            options={[
              { value: "ALL", label: "Semua Status" },
              { value: "PENDING", label: "Menunggu" },
              { value: "APPROVED", label: "Disetujui" },
              { value: "COMPLETED", label: "Selesai" },
              { value: "REJECTED", label: "Ditolak" },
            ]}
          />
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
                <th className="px-4 py-3 text-center">Aksi</th>
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
                    <td className="px-4 py-3">{formatDateIdShort(item.startTime)}</td>
                    <td className="px-4 py-3">
                      {formatTimeIdShort(item.startTime)} - {formatTimeIdShort(item.endTime)}
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-500">
                    Belum ada data pengajuan terbaru.
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
                  <p className="text-sm text-slate-700">{formatDateIdShort(item.startTime)}</p>
                  <p className="text-xs text-slate-500">
                    {formatTimeIdShort(item.startTime)} - {formatTimeIdShort(item.endTime)}
                  </p>
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
                <button
                  type="button"
                  onClick={() => handleDeleteClick(item)}
                  className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-600 transition-colors hover:bg-rose-100"
                  title="Hapus Data Pengajuan"
                  aria-label={`Hapus pengajuan ${item.activityName}`}
                >
                  <Trash2 size={16} />
                </button>
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