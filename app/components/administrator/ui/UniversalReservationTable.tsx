"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight, Trash2, CheckCircle } from "lucide-react";
import { useToast } from "@/app/components/ui/toast";
import StatusBadge from "@/app/components/administrator/ui/StatusBadge";
import DeleteConfirmationModal from "@/app/components/administrator/ui/DeleteConfirmationModal";
import ReservationDetailModal from "@/app/components/administrator/monitoring-pengajuan/ReservationDetailModal";
import MonitoringDetailModal from "@/app/components/administrator/monitoring-pengajuan/MonitoringDetailModal";
import {
  SuperAdminTableCard,
  SuperAdminTableScroll,
  SuperAdminTable,
  SuperAdminTableBody,
  SuperAdminTableMessageRow,
} from "@/app/components/administrator/ui/SuperAdminTable";
import { computeReservationStatus, resolveReservationStatusGroup } from "@/app/components/administrator/ui/reservationStatus";
import ActionConfirmationModal from "@/app/components/administrator/ui/ActionConfirmationModal";

const PAGE_SIZE = 10;

type GenericReservation = {
  id: string;
  user: { name: string; userType?: string };
  activityName: string;
  purpose?: string;
  startTime: string;
  endTime: string;
  room: { name: string; building?: string };
  status: string;
  createdAt: string;
  // optional admin-only fields
  processedAt?: string | null;
};

type Props = {
  data: GenericReservation[];
  mode?: "admin" | "superadmin";
  adminRole?: string;
  onStatusUpdated?: (id: string, updates: any) => void;
  onDeleteSuccess?: (id: string) => void;
  showControls?: boolean;
  showDelete?: boolean;
};

function formatDate(dateInput: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(dateInput),
  );
}

function formatTime(dateInput: string) {
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date(dateInput));
}

function resolveFilterStatusGroup(status: string, endTimeInput: string) {
  const computed = computeReservationStatus(status, endTimeInput);
  const normalized = (computed ?? "").toUpperCase();

  if (normalized === "COMPLETED" || normalized === "SELESAI") return "COMPLETED";
  if (normalized.startsWith("REJECT") || normalized.includes("DITOLAK")) return "REJECTED";
  if (normalized === "APPROVED" || normalized === "DISETUJUI") return "APPROVED";
  if (normalized === "PENDING" || normalized === "PENDING_KABAG") return "PENDING";

  return "PENDING";
}

function canAdminAct(role: string, status: string) {
  const normStatus = (status || "").toUpperCase();
  const normRole = (role || "").toUpperCase();

  if (normRole === "ADMIN") {
    return normStatus === "PENDING" || normStatus === "PENDING_KABAG";
  }
  if (normRole === "ADMIN_DEKAN") {
    return normStatus === "PENDING_DEKAN";
  }
  if (normRole === "ADMIN_WD2") {
    return normStatus === "PENDING_WD2" || normStatus === "PENDING_WAKIL_DEKAN_2";
  }
  if (normRole === "KAJUR") {
    return normStatus === "PENDING_KAJUR";
  }
  if (normRole === "KEPALA_LAB") {
    return normStatus === "PENDING_KEPALA_LAB";
  }
  return false;
}

export default function UniversalReservationTable({
  data,
  mode = "superadmin",
  adminRole,
  onStatusUpdated,
  onDeleteSuccess,
  showControls = true,
  showDelete = true,
}: Props) {
  const { pushToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED">("ALL");
  const [processing, setProcessing] = useState<{ id: string; action: "APPROVE" | "REJECT" | "COMPLETE" } | null>(null);
  const [selectedRow, setSelectedRow] = useState<GenericReservation | null>(null);
  const [tableData, setTableData] = useState<GenericReservation[]>(data);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; item: GenericReservation | null }>({ isOpen: false, item: null });
  const [decisionConfirm, setDecisionConfirm] = useState<{ isOpen: boolean; item: GenericReservation | null; action: "APPROVE" | "REJECT" | "COMPLETE" | null }>({ isOpen: false, item: null, action: null });
  const isAdminMode = mode === "admin";

  useEffect(() => setTableData(data), [data]);

  const filteredAndSortedData = useMemo(() => {
    const filtered =
      filterStatus === "ALL"
        ? tableData
        : tableData.filter((item) => resolveFilterStatusGroup(item.status, item.endTime) === filterStatus);

    return [...filtered].sort((a, b) => {
      const left = new Date(a.createdAt).getTime();
      const right = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? right - left : left - right;
    });
  }, [tableData, filterStatus, sortOrder]);

  useEffect(() => setCurrentPage(1), [filterStatus, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedData.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAndSortedData.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredAndSortedData]);

  const pageItems = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
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
    if (start > 2) items.push("ellipsis-left");
    for (let page = start; page <= end; page += 1) items.push(page);
    if (end < totalPages - 1) items.push("ellipsis-right");
    items.push(totalPages);
    return items;
  }, [currentPage, totalPages]);

  const handleDecision = async (id: string, action: "APPROVE" | "REJECT") => {
    if (!isAdminMode || processing) return;
    setProcessing({ id, action });

    try {
      const response = await fetch(`/api/admin/reservations/${id}/decision`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.status) throw new Error(payload.error || "Gagal memproses pengajuan");

      const updates: Partial<GenericReservation> = { status: payload.status, processedAt: payload.processedAt ?? null };
      onStatusUpdated?.(id, updates);
      setSelectedRow((prev) => (prev && prev.id === id ? { ...prev, ...updates } : prev));
      pushToast({ type: "success", message: action === "APPROVE" ? "Pengajuan berhasil disetujui." : "Pengajuan berhasil ditolak." });
    } catch (error) {
      pushToast({ type: "error", message: error instanceof Error ? error.message : "Terjadi kesalahan saat memproses." });
    } finally {
      setProcessing(null);
    }
  };

  const handleComplete = async (id: string) => {
    if (isAdminMode || processing) return;
    setProcessing({ id, action: "COMPLETE" });

    try {
      const response = await fetch(`/api/reservasi/complete?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      const payload = await response.json();
      if (!response.ok || !payload.status) throw new Error(payload.error || "Gagal menyelesaikan pengajuan");

      const updates: Partial<GenericReservation> = { status: payload.status, processedAt: payload.processedAt ?? null };
      onStatusUpdated?.(id, updates);
      setSelectedRow((prev) => (prev && prev.id === id ? { ...prev, ...updates } : prev));
      setTableData((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
      pushToast({ type: "success", message: "Pengajuan berhasil diselesaikan." });
    } catch (error) {
      pushToast({ type: "error", message: error instanceof Error ? error.message : "Terjadi kesalahan saat memproses." });
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteClick = (item: GenericReservation) => setDeleteModal({ isOpen: true, item });

  const handleDeleteConfirm = async () => {
    if (!deleteModal.item) return;
    const deletedId = deleteModal.item.id;
    try {
      const response = await fetch(`/api/reservasi/delete?id=${deletedId}`, { method: "DELETE" });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal menghapus pengajuan");
      }
      setTableData((prev) => prev.filter((it) => it.id !== deletedId));
      setSelectedRow((prev) => (prev?.id === deletedId ? null : prev));
      setDeleteModal({ isOpen: false, item: null });
      onDeleteSuccess?.(deletedId);
      pushToast({ type: "success", message: "Pengajuan berhasil dihapus." });
    } catch (err) {
      pushToast({ type: "error", message: err instanceof Error ? err.message : "Gagal menghapus." });
    }
  };

  const handleDeleteCancel = () => setDeleteModal({ isOpen: false, item: null });

  return (
    <>
      <div className="space-y-3">
        {showControls ? (
          <div className="mb-3 flex flex-row flex-wrap items-center gap-2">
            <label className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <ArrowUpDown size={14} className="text-slate-500" />
              <span>Urutkan</span>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
                className="bg-transparent text-sm font-semibold outline-none">
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
              </select>
            </label>

            <label className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <span>Filter Status</span>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="bg-transparent text-sm font-semibold outline-none">
                <option value="ALL">Semua Status</option>
                <option value="PENDING">Menunggu</option>
                <option value="APPROVED">Disetujui</option>
                <option value="COMPLETED">Selesai</option>
                <option value="REJECTED">Ditolak</option>
              </select>
            </label>
          </div>
        ) : null}

        <div className="hidden lg:block">
          <SuperAdminTableCard className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <SuperAdminTableScroll>
              <SuperAdminTable className="min-w-275 w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">No</th>
                    <th className="px-4 py-3">Nama Lengkap</th>
                    <th className="px-4 py-3">Tanggal & Waktu Peminjaman</th>
                    <th className="px-4 py-3">Tanggal & Waktu Pengajuan</th>
                    <th className="px-4 py-3">Ruangan</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    {isAdminMode ? <th className="px-4 py-3 text-center">Aksi</th> : <th className="px-4 py-3 text-center">Detail</th>}
                  </tr>
                </thead>
                <SuperAdminTableBody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((item, index) => (
                      <tr key={item.id} className="border-t border-slate-100 text-slate-700">
                        <td className="px-4 py-3 text-xs text-slate-500">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{item.user.name}</td>
                        <td className="px-4 py-3"><p className="text-slate-900">{formatDate(item.startTime)}</p><p className="text-xs text-slate-500">{formatTime(item.startTime)} - {formatTime(item.endTime)}</p></td>
                        <td className="px-4 py-3"><p className="text-slate-900">{formatDate(item.createdAt)}</p><p className="text-xs text-slate-500">{formatTime(item.createdAt)}</p></td>
                        <td className="px-4 py-3"><p className="font-semibold text-slate-900">{item.room.name}</p><p className="text-xs text-slate-500">{item.room.building}</p></td>
                        <td className="px-2 py-3 text-center align-middle"><div className="flex w-full justify-center"><StatusBadge status={computeReservationStatus(item.status, item.endTime)} /></div></td>
                        {isAdminMode && canAdminAct(adminRole || "", item.status) ? (
                          <td className="px-2 py-3 text-center align-middle"><div className="flex w-full justify-center"><button type="button" onClick={() => setSelectedRow(item)} className="rounded-lg border border-slate-800 bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700">Tinjau &amp; Proses</button></div></td>
                        ) : (
                          <td className="px-2 py-3 text-center align-middle">
                            {/* Superadmin actions container */}
                            <div className="flex w-full justify-center gap-1.5">
                              <button type="button" onClick={() => setSelectedRow(item)} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">Lihat Detail</button>
                              <button type="button" title="Selesaikan" disabled={computeReservationStatus(item.status, item.endTime) === 'APPROVED' || computeReservationStatus(item.status, item.endTime) === 'COMPLETED'} onClick={() => setDecisionConfirm({ isOpen: true, item, action: "COMPLETE" })} className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-600 transition-colors hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"><CheckCircle size={16} /></button>
                              {!isAdminMode && <button type="button" title="Hapus" onClick={() => handleDeleteClick(item)} className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-600 transition-colors hover:bg-rose-100"><Trash2 size={16} /></button>}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <SuperAdminTableMessageRow colSpan={8}>Belum ada data pengajuan terbaru.</SuperAdminTableMessageRow>
                  )}
                </SuperAdminTableBody>
              </SuperAdminTable>
            </SuperAdminTableScroll>
          </SuperAdminTableCard>
        </div>

        <div className="lg:hidden space-y-3">
          {paginatedData.length > 0 ? (
            paginatedData.map((item) => (
              <div key={item.id} className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
                {/* Header: Name + Status */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Nama Lengkap</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-900 leading-snug">{item.user.name}</p>
                  </div>
                  <div className="shrink-0 pt-3">
                    <StatusBadge status={computeReservationStatus(item.status, item.endTime)} />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3 px-4 py-3">
                  {/* Room */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Ruangan</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">{item.room.name}</p>
                    <p className="text-xs text-slate-500">{item.room.building}</p>
                  </div>

                  {/* Date Grid: Peminjaman + Pengajuan side by side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tanggal &amp; Waktu Peminjaman</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-800">{formatDate(item.startTime)}</p>
                      <p className="text-xs text-slate-500">{formatTime(item.startTime)} - {formatTime(item.endTime)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tanggal &amp; Waktu Pengajuan</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-800">{formatDate(item.createdAt)}</p>
                      <p className="text-xs text-slate-500">{formatTime(item.createdAt)}</p>
                    </div>
                  </div>

                  {/* Activity + Purpose */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Nama Kegiatan</p>
                      <p className="mt-0.5 text-sm text-slate-700 leading-snug">{item.activityName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tujuan Peminjaman</p>
                      <p className="mt-0.5 text-sm text-slate-700 leading-snug">{item.purpose}</p>
                    </div>
                  </div>
                </div>

                {/* Action */}
                <div className="border-t border-slate-100 px-4 py-3 flex gap-2">
                  {isAdminMode && canAdminAct(adminRole || "", item.status) ? (
                    <button type="button" onClick={() => setSelectedRow(item)} className="flex-1 rounded-lg border border-slate-800 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 active:bg-slate-900">Tinjau &amp; Proses</button>
                  ) : (
                    <>
                      <button type="button" onClick={() => setSelectedRow(item)} className="flex-1 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 active:bg-blue-200">Lihat Detail</button>
                      <button type="button" title="Selesaikan" disabled={computeReservationStatus(item.status, item.endTime) === 'APPROVED' || computeReservationStatus(item.status, item.endTime) === 'COMPLETED'} onClick={() => setDecisionConfirm({ isOpen: true, item, action: "COMPLETE" })} className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-emerald-600 transition-colors hover:bg-emerald-100 active:bg-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"><CheckCircle size={18} /></button>
                    </>
                  )}

                  {!isAdminMode ? (
                    <button type="button" title="Hapus" onClick={() => handleDeleteClick(item)} className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-rose-600 transition-colors hover:bg-rose-100 active:bg-rose-200"><Trash2 size={18} /></button>
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

        <div className="flex items-center gap-2 text-sm">
          <button type="button" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Halaman sebelumnya"><ChevronLeft size={16} /></button>
          {pageItems.map((item, index) =>
            typeof item !== "number" ? (
              <span key={`${item}-${index}`} className="px-1 text-slate-400">...</span>
            ) : (
              <button key={item} type="button" onClick={() => setCurrentPage(item)} className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 font-semibold transition-colors ${item === currentPage ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`} aria-label={`Halaman ${item}`} aria-current={item === currentPage ? "page" : undefined}>{item}</button>
            ),
          )}
          <button type="button" onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Halaman berikutnya"><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Detail modals */}
      {isAdminMode ? (
        <ReservationDetailModal
          data={selectedRow as any}
          adminRole={adminRole as any}
          isActionable={Boolean(selectedRow && canAdminAct(adminRole || "", selectedRow.status))}
          isBusy={Boolean(selectedRow && processing?.id === selectedRow.id)}
          onClose={() => setSelectedRow(null)}
          onApprove={() => selectedRow && setDecisionConfirm({ isOpen: true, item: selectedRow, action: "APPROVE" })}
          onReject={() => selectedRow && setDecisionConfirm({ isOpen: true, item: selectedRow, action: "REJECT" })}
        />
      ) : (
        <MonitoringDetailModal data={selectedRow as any} onClose={() => setSelectedRow(null)} />
      )}

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Hapus Data Pengajuan"
        description={`Data pengajuan "${deleteModal.item?.activityName}" akan dihapus.`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={false}
      />

      <ActionConfirmationModal
        isOpen={decisionConfirm.isOpen}
        action={decisionConfirm.action}
        title={decisionConfirm.action === "COMPLETE" ? "Selesaikan Pengajuan" : decisionConfirm.action === "APPROVE" ? "Setujui Pengajuan" : "Tolak Pengajuan"}
        description={
          decisionConfirm.action === "COMPLETE"
            ? `Anda yakin ingin menyelesaikan pengajuan dari "${decisionConfirm.item?.user.name}" untuk kegiatan "${decisionConfirm.item?.activityName}" secara langsung?`
            : `Anda yakin ingin ${decisionConfirm.action === "APPROVE" ? "menyetujui" : "menolak"} pengajuan dari "${decisionConfirm.item?.user.name}" untuk kegiatan "${decisionConfirm.item?.activityName}"?`
        }
        onConfirm={async () => {
          if (decisionConfirm.item && decisionConfirm.action) {
            if (decisionConfirm.action === "COMPLETE") {
              await handleComplete(decisionConfirm.item.id);
            } else {
              await handleDecision(decisionConfirm.item.id, decisionConfirm.action);
            }
            setDecisionConfirm({ isOpen: false, item: null, action: null });
          }
        }}
        onCancel={() => setDecisionConfirm({ isOpen: false, item: null, action: null })}
        isLoading={Boolean(processing)}
      />
    </>
  );
}
