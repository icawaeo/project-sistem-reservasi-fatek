"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight, Eye } from "lucide-react";

import { computeReservationStatus, resolveReservationStatusGroup } from "@/app/components/administrator/common/reservationStatus";
import { useToast } from "@/app/components/ui/toast";
import type { AdminReservationRecord, AdminRole } from "@/app/components/administrator/admin/types";
import {
	SuperAdminTableCard,
	SuperAdminTableScroll,
	SuperAdminTable,
	SuperAdminTableBody,
	SuperAdminTableMessageRow,
} from "../ui/SuperAdminTable";
import ReservationDetailModal from "./ReservationDetailModal";

const PAGE_SIZE = 10;

type FilterStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

type ReservationActionTableProps = {
	data: AdminReservationRecord[];
	adminRole: AdminRole;
	onStatusUpdated: (id: string, updates: Partial<AdminReservationRecord>) => void;
	showControls?: boolean;
	mode?: "admin" | "superadmin";
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

function resolveFilterStatusGroup(status: string, endTimeInput: string): Exclude<FilterStatus, "ALL"> {
	const computed = computeReservationStatus(status, endTimeInput);
	const normalized = (computed ?? "").toUpperCase();

	if (normalized === "COMPLETED" || normalized === "SELESAI") return "COMPLETED";
	if (normalized.startsWith("REJECT") || normalized.includes("DITOLAK")) return "REJECTED";
	if (normalized === "APPROVED" || normalized === "DISETUJUI") return "APPROVED";
	if (normalized === "PENDING" || normalized === "PENDING_KABAG") return "PENDING";

	return "PENDING";
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

export default function ReservationActionTable({
	data,
	adminRole,
	onStatusUpdated,
	showControls = true,
	mode = "admin",
}: ReservationActionTableProps) {
	const { pushToast } = useToast();
	const [currentPage, setCurrentPage] = useState(1);
	const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
	const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
	const [processing, setProcessing] = useState<{ id: string; action: "APPROVE" | "REJECT" } | null>(null);
	const [selectedRow, setSelectedRow] = useState<AdminReservationRecord | null>(null);
	const isAdminMode = mode === "admin";

	const filteredAndSortedData = useMemo(() => {
		const filtered =
			filterStatus === "ALL"
				? data
					: data.filter((item) => resolveFilterStatusGroup(item.status, item.endTime) === filterStatus);

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
			pushToast({ type: "success", message: action === "APPROVE" ? "Pengajuan berhasil disetujui." : "Pengajuan berhasil ditolak." });
		} catch (error) {
			pushToast({ type: "error", message: error instanceof Error ? error.message : "Terjadi kesalahan saat memproses." });
		} finally {
			setProcessing(null);
		}
	};

	return (
		<>
			<div className="space-y-3">
				{showControls ? (
					<div className="mb-3 flex flex-row flex-wrap items-center gap-2">
						<label className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
							<ArrowUpDown size={14} className="text-slate-500" />
							<span>Urutkan</span>
							<select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as "newest" | "oldest")} className="bg-transparent text-sm font-semibold outline-none">
								<option value="newest">Terbaru</option>
								<option value="oldest">Terlama</option>
							</select>
						</label>

						<label className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
							<span>Filter Status</span>
							<select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value as FilterStatus)} className="bg-transparent text-sm font-semibold outline-none">
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
										<th className="px-4 py-3">Nama Kegiatan</th>
										<th className="px-4 py-3">Tujuan Peminjaman</th>
										<th className="px-4 py-3">Tanggal Peminjaman</th>
										<th className="px-4 py-3">Waktu</th>
										<th className="px-4 py-3">Ruangan</th>
										<th className="px-4 py-3 text-center">Status</th>
										{isAdminMode ? (
											<th className="px-4 py-3 text-center">Aksi</th>
										) : (
											<th className="px-4 py-3 text-center">Detail</th>
										)}
									</tr>
								</thead>
								<SuperAdminTableBody>
									{paginatedData.length > 0 ? (
										paginatedData.map((item, index) => (
											<tr key={item.id} className="border-t border-slate-100 text-slate-700">
												<td className="px-4 py-3 text-xs text-slate-500">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
												<td className="px-4 py-3 font-semibold text-slate-900">{item.user.name}</td>
												<td className="px-4 py-3">{item.activityName}</td>
												<td className="px-4 py-3">{item.purpose}</td>
												<td className="px-4 py-3">{formatDate(item.startTime)}</td>
												<td className="px-4 py-3">{formatTime(item.startTime)} - {formatTime(item.endTime)}</td>
												<td className="px-4 py-3">
													<p className="font-semibold text-slate-900">{item.room.name}</p>
													<p className="text-xs text-slate-500">{item.room.building}</p>
												</td>
												<td className="px-2 py-3 text-center align-middle"><div className="flex w-full justify-center"><span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{computeReservationStatus(item.status, item.endTime)}</span></div></td>
												{isAdminMode ? (
													<td className="px-2 py-3 text-center align-middle">
														<div className="flex w-full justify-center">
															<button type="button" onClick={() => setSelectedRow(item)} className="rounded-lg border border-slate-800 bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700">Tinjau &amp; Proses</button>
														</div>
													</td>
												) : (
													<td className="px-2 py-3 text-center align-middle">
														<div className="flex w-full justify-center">
															<button type="button" onClick={() => setSelectedRow(item)} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">Lihat Detail</button>
														</div>
													</td>
												)}
											</tr>
										))
									) : (
											<SuperAdminTableMessageRow colSpan={isAdminMode ? 9 : 9}>Belum ada data pengajuan terbaru.</SuperAdminTableMessageRow>
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
								<div className="flex-1 space-y-2 p-4">
									<div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nama Pengaju</p><p className="text-sm font-semibold text-slate-900">{item.user.name}</p></div>
									<div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kegiatan</p><p className="text-sm text-slate-700">{item.activityName}</p></div>
									<div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tujuan</p><p className="text-sm text-slate-700">{item.purpose}</p></div>
									<div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ruangan</p><p className="text-sm font-semibold text-slate-900">{item.room.name}</p><p className="text-xs text-slate-500">{item.room.building}</p></div>
									<div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tanggal &amp; Waktu</p><p className="text-sm text-slate-700">{formatDate(item.startTime)}</p><p className="text-xs text-slate-500">{formatTime(item.startTime)} - {formatTime(item.endTime)}</p></div>
								</div>
								<div className="border-t border-slate-200 p-4 flex gap-2">
									{isAdminMode ? (
										<button type="button" onClick={() => setSelectedRow(item)} className="flex-1 rounded-lg border border-slate-800 bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700">Tinjau &amp; Proses</button>
									) : (
										<button type="button" onClick={() => setSelectedRow(item)} className="flex-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">Lihat Detail</button>
									)}
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
					{pageItems.map((item, index) => typeof item !== "number" ? <span key={`${item}-${index}`} className="px-1 text-slate-400">...</span> : <button key={item} type="button" onClick={() => setCurrentPage(item)} className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 font-semibold transition-colors ${item === currentPage ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`} aria-label={`Halaman ${item}`} aria-current={item === currentPage ? "page" : undefined}>{item}</button>)}
					<button type="button" onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Halaman berikutnya"><ChevronRight size={16} /></button>
				</div>
			</div>

			<ReservationDetailModal
				data={selectedRow}
				adminRole={adminRole}
				isActionable={isAdminMode && selectedRow ? isActionableStatusForRole(adminRole, selectedRow.status) : false}
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