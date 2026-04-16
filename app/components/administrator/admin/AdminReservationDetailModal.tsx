"use client";

import { FileText, X } from "lucide-react";

import type { AdminReservationRecord, AdminRole } from "./types";
import ReservationProgressBar from "@/app/components/administrator/admin/ReservationProgressBar";
import { computeReservationStatus } from "@/app/components/administrator/superadmin/reservationStatus";

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

function resolveRoleLabel(role: AdminRole) {
	if (role === "ADMIN") return "Admin";
	if (role === "ADMIN_DEKAN") return "Admin Dekan";
	if (role === "ADMIN_WD2") return "Admin Wakil Dekan 2";
	if (role === "KAJUR") return "Kajur";
	return "Kepala Lab";
}

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

	const applicantSubtitle =
		data.user.userType === "PUBLIC" ? "Umum" : data.user.userType === "STAFF" ? "Staff" : "Mahasiswa";
	const purposeLabel = data.purpose && data.purpose !== "-" ? data.purpose : data.rawPurpose;
	const roleLabel = resolveRoleLabel(adminRole);
	const computedStatus = computeReservationStatus(data.status, data.endTime);
	const normalizedStatus = (computedStatus ?? "").toUpperCase();
	const isDecisionLetterReady =
		normalizedStatus === "APPROVED" ||
		normalizedStatus === "DISETUJUI" ||
		normalizedStatus === "COMPLETED" ||
		normalizedStatus === "SELESAI";

	const decisionLetterPdfUrl = `/api/admin/decision-letter/pdf?flow=${encodeURIComponent(data.flow)}`;

	return (
		<div
			className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4"
			onClick={onClose}
		>
			<div
				className="flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
				style={{ maxHeight: "90vh" }}
				onClick={(event) => event.stopPropagation()}
			>
				{/* Modal Header */}
				<header className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 px-8 py-6">
					<div>
						<h3 className="text-xl font-bold text-slate-900">Detail Pengajuan</h3>
						<p className="mt-1 text-xs font-medium text-slate-500">Role Anda: {roleLabel}</p>
					</div>

					<button
						type="button"
						onClick={onClose}
						className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"
						aria-label="Tutup"
					>
						<X size={18} />
					</button>
				</header>

				{/* Modal Content */}
				<div className="flex-1 overflow-y-auto p-8">
					<div className="space-y-8">
						{/* Tracking Progress Bar (letakkan di atas Applicant Info & Location & Specs) */}
						<ReservationProgressBar data={data} />

						{/* Row: Applicant card + Location card (same height) */}
						<div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
							<div className="flex h-full flex-col">
								<span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
									Applicant Info
								</span>
								<div className="flex h-full flex-1 items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
									<div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-lg font-bold text-white">
										{(data.user.name || "U").slice(0, 1).toUpperCase()}
									</div>
									<div className="min-w-0">
										<h4 className="truncate font-bold text-slate-900">{data.user.name}</h4>
										<p className="truncate text-sm text-slate-500">{applicantSubtitle}</p>
										<p className="truncate text-xs text-slate-500">{data.user.email}</p>
									</div>
								</div>
							</div>

							<div className="flex h-full flex-col">
								<span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
									Location &amp; Specs
								</span>
								<div className="h-full flex-1 rounded-xl border border-slate-200 bg-white p-4">
									<h4 className="font-bold text-slate-900">{data.room.name}</h4>
									<p className="mt-1 text-sm text-slate-500">{data.room.building}</p>
									<p className="mt-1 text-xs text-slate-500">{data.room.location || "-"}</p>
								</div>
							</div>
						</div>

						{/* Row: Activity details + Timeline */}
						<div className="mt-4 grid grid-cols-1 items-start gap-6 md:grid-cols-2">
							<div>
								<span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
									Activity Details
								</span>
								<h4 className="text-lg font-bold text-slate-900">{data.activityName}</h4>
								<p className="mt-1 text-sm leading-relaxed text-slate-700">{purposeLabel || "-"}</p>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
										Reservation Date
									</span>
									<div className="text-sm font-semibold text-slate-900">{formatDate(data.startTime)}</div>
									<div className="text-xs text-slate-500">
										{formatTime(data.startTime)} - {formatTime(data.endTime)}
									</div>
								</div>
								<div>
									<span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
										Submitted At
									</span>
									<div className="text-sm font-semibold text-slate-900">{formatDateTime(data.createdAt)}</div>
								</div>
							</div>
						</div>

						{/* Section: Document Preview */}
						<div className="mt-10">
							<span className="mb-4 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
								Supporting Documents
							</span>
							<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
								<div>
									<span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
										{data.flow === "LAB_SKRIPSI" ? "SK Pembimbingan" : "Surat Pengantar"}
									</span>
									<div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
										{data.documentUrl ? (
											<iframe title="Preview Surat Pengantar" src={data.documentUrl} className="h-72 w-full bg-white" />
										) : (
											<div className="flex h-72 items-center justify-center bg-white px-6 text-center">
												<div>
													<p className="text-sm font-semibold text-slate-700">Preview tidak tersedia</p>
													<p className="mt-1 text-xs text-slate-500">Surat pengantar belum diunggah.</p>
												</div>
											</div>
										)}
									</div>
								</div>

								<div>
									<span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
										Surat Keputusan
									</span>
									<div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
										{isDecisionLetterReady ? (
											<object
												data={decisionLetterPdfUrl}
												type="application/pdf"
												className="h-72 w-full"
												title="Preview Surat Keputusan"
											>
												<div className="flex h-72 items-center justify-center bg-white px-6 text-center">
													<div>
														<p className="text-sm font-semibold text-slate-700">Preview tidak tersedia</p>
														<p className="mt-1 text-xs text-slate-500">Surat keputusan gagal dimuat.</p>
													</div>
												</div>
											</object>
										) : (
											<div className="flex h-72 items-center justify-center bg-white px-6 text-center">
												<div>
													<p className="text-sm font-semibold text-slate-700">Surat keputusan belum tersedia</p>
													<p className="mt-1 text-xs text-slate-500">
														Surat keputusan akan tersedia setelah pengajuan disetujui/selesai.
													</p>
												</div>
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Modal Footer */}
				<footer className="flex items-center justify-end gap-4 border-t border-slate-200 bg-slate-50/50 px-8 py-6">
					<button
						type="button"
						onClick={onReject}
						disabled={!isActionable || isBusy}
						className="rounded-xl border border-rose-200 bg-rose-50 px-8 py-3 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
					>
						Tolak Pengajuan
					</button>
					<button
						type="button"
						onClick={onApprove}
						disabled={!isActionable || isBusy}
						className="rounded-xl border border-emerald-200 bg-emerald-50 px-10 py-3 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
					>
						Setujui Pengajuan
					</button>
				</footer>
			</div>
		</div>
	);
}
