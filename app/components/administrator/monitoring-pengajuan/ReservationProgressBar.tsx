"use client";

import { Check } from "lucide-react";

import type { AdminReservationRecord } from "@/app/components/administrator/monitoring-pengajuan/reservation-types";
import { computeReservationStatus } from "@/app/components/administrator/ui/reservationStatus";

type StepState = "done" | "current" | "pending" | "rejected";

type ReservationProgressBarProps = {
	data: AdminReservationRecord;
};

type Step = { key: string; label: string; shortLabel: string };

function resolveSteps(flow: AdminReservationRecord["flow"]): Step[] {
	if (flow === "LAB_SKRIPSI") {
		return [
			{ key: "SUBMITTED", label: "Diajukan", shortLabel: "Diajukan" },
			{ key: "WAITING_KEPALA_LAB", label: "Menunggu Persetujuan Kepala Lab", shortLabel: "Kepala Lab" },
			{ key: "DECISION", label: "Disetujui/Ditolak", shortLabel: "Disetujui/Ditolak" },
			{ key: "COMPLETED", label: "Selesai", shortLabel: "Selesai" },
		];
	}

	if (flow === "LAB_LAINNYA") {
		return [
			{ key: "SUBMITTED", label: "Diajukan", shortLabel: "Diajukan" },
			{ key: "WAITING_KAJUR", label: "Menunggu Persetujuan Kepala Jurusan", shortLabel: "Kepala Jurusan" },
			{ key: "WAITING_KEPALA_LAB", label: "Menunggu Persetujuan Kepala Lab", shortLabel: "Kepala Lab" },
			{ key: "DECISION", label: "Disetujui/Ditolak", shortLabel: "Disetujui/Ditolak" },
			{ key: "COMPLETED", label: "Selesai", shortLabel: "Selesai" },
		];
	}

	return [
		{ key: "SUBMITTED", label: "Diajukan", shortLabel: "Diajukan" },
		{ key: "WAITING_DEKAN", label: "Menunggu Persetujuan Dekan", shortLabel: "Dekan" },
		{ key: "WAITING_WD2", label: "Menunggu TTD Wakil Dekan 2", shortLabel: "TTD WD2" },
		{ key: "DECISION", label: "Disetujui/Ditolak", shortLabel: "Disetujui/Ditolak" },
		{ key: "COMPLETED", label: "Selesai", shortLabel: "Selesai" },
	];
}

function formatProgressDateTime(dateInput: string) {
	try {
		const date = new Date(dateInput);
		const dateLabel = new Intl.DateTimeFormat("id-ID", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		}).format(date);

		const timeLabel = new Intl.DateTimeFormat("id-ID", {
			hour: "2-digit",
			minute: "2-digit",
		}).format(date);

		return `${dateLabel} ${timeLabel}`;
	} catch {
		return "---";
	}
}

function normalizeReservationStatus(statusRaw: string) {
	return (statusRaw ?? "").toUpperCase();
}

function resolveDecisionLabel(statusRaw: string) {
	const status = normalizeReservationStatus(statusRaw);
	if (status.startsWith("REJECT") || status.includes("DITOLAK")) return "Ditolak";
	if (status === "APPROVED" || status === "DISETUJUI" || status === "COMPLETED" || status === "SELESAI") return "Disetujui";
	return "Disetujui/Ditolak";
}

function resolveDecisionShortLabel(statusRaw: string) {
	const status = normalizeReservationStatus(statusRaw);
	if (status.startsWith("REJECT") || status.includes("DITOLAK")) return "Ditolak";
	if (status === "APPROVED" || status === "DISETUJUI" || status === "COMPLETED" || status === "SELESAI") return "Disetujui";
	return "Disetujui/Ditolak";
}

function resolveProgressState(statusRaw: string, flow: AdminReservationRecord["flow"], steps: Step[]) {
	const status = normalizeReservationStatus(statusRaw);

	const isCompleted = status === "COMPLETED" || status === "SELESAI";
	const isApproved = status === "APPROVED" || status === "DISETUJUI";
	const isRejected = status.startsWith("REJECT") || status.includes("DITOLAK");

	const lastIndex = Math.max(0, steps.length - 1);

	if (isCompleted) {
		return { currentIndex: lastIndex, isComplete: true, rejectedIndex: null as number | null };
	}

	if (isRejected) {
		const decisionIndex = Math.max(0, steps.findIndex((step) => step.key === "DECISION"));
		return { currentIndex: decisionIndex, isComplete: false, rejectedIndex: decisionIndex };
	}

	if (isApproved) {
		const decisionIndex = Math.max(0, steps.findIndex((step) => step.key === "DECISION"));
		return { currentIndex: decisionIndex, isComplete: false, rejectedIndex: null as number | null };
	}

	if (flow === "LAB_SKRIPSI") {
		if (status === "PENDING_KEPALA_LAB") {
			return { currentIndex: 1, isComplete: false, rejectedIndex: null };
		}

		if (status === "PENDING" || status === "PENDING_KABAG") {
			return { currentIndex: 0, isComplete: false, rejectedIndex: null };
		}

		return { currentIndex: 0, isComplete: false, rejectedIndex: null };
	}

	if (flow === "LAB_LAINNYA") {
		if (status === "PENDING_KEPALA_LAB") {
			return { currentIndex: 2, isComplete: false, rejectedIndex: null };
		}

		if (status === "PENDING_KAJUR") {
			return { currentIndex: 1, isComplete: false, rejectedIndex: null };
		}

		if (status === "PENDING" || status === "PENDING_KABAG") {
			return { currentIndex: 0, isComplete: false, rejectedIndex: null };
		}

		return { currentIndex: 0, isComplete: false, rejectedIndex: null };
	}

	if (status === "PENDING_WD2" || status === "PENDING_WAKIL_DEKAN_2") {
		return { currentIndex: 2, isComplete: false, rejectedIndex: null };
	}

	if (status === "PENDING_DEKAN") {
		return { currentIndex: 1, isComplete: false, rejectedIndex: null };
	}

	if (status === "PENDING" || status === "PENDING_KABAG") {
		return { currentIndex: 0, isComplete: false, rejectedIndex: null };
	}

	return { currentIndex: 0, isComplete: false, rejectedIndex: null };
}

function resolveStepState(params: { stepIndex: number; currentIndex: number; rejectedIndex: number | null; isComplete: boolean }): StepState {
	if (params.rejectedIndex === params.stepIndex) return "rejected";
	if (params.isComplete) return "done";
	if (params.stepIndex < params.currentIndex) return "done";
	if (params.stepIndex === params.currentIndex) return "current";
	return "pending";
}

function resolveSecondaryText(params: { stepIndex: number; state: StepState; data: AdminReservationRecord; status: string; steps: Step[] }) {
	const { stepIndex, state, data, status } = params;

	if (state === "pending") return { text: "---", className: "text-slate-400" };

	const normalizedStatus = normalizeReservationStatus(status);
	const isCompleted = normalizedStatus === "COMPLETED" || normalizedStatus === "SELESAI";
	const isApproved = normalizedStatus === "APPROVED" || normalizedStatus === "DISETUJUI";
	const isRejected = normalizedStatus.startsWith("REJECT") || normalizedStatus.includes("DITOLAK");

	const dateValue = (() => {
		const step = params.steps[stepIndex];
		if (!step) return null;
		if (step.key === "SUBMITTED") return data.createdAt;
		if (step.key === "WAITING_DEKAN") return data.waitingDekanAt;
		if (step.key === "WAITING_WD2") return data.waitingWd2At;
		if (step.key === "WAITING_KAJUR") return data.waitingKajurAt;
		if (step.key === "WAITING_KEPALA_LAB") return data.waitingKepalaLabAt;
		if (step.key === "DECISION") return data.decisionAt;
		if (step.key === "COMPLETED") {
			if (isCompleted || isApproved) return data.endTime;
			if (isRejected) return null;
			return null;
		}
		return null;
	})();

	if (!dateValue) return { text: "---", className: "text-slate-400" };

	if (state === "current") {
		return { text: formatProgressDateTime(dateValue), className: "text-amber-700" };
	}

	if (state === "rejected") {
		return { text: formatProgressDateTime(dateValue), className: "text-rose-700" };
	}

	return { text: formatProgressDateTime(dateValue), className: "text-slate-500" };
}

function circleClass(state: StepState) {
	if (state === "done") return "border-2 border-emerald-600 bg-emerald-600 text-white";
	if (state === "rejected") return "border-2 border-rose-600 bg-rose-600 text-white";
	if (state === "current") return "border-4 border-amber-500 bg-white text-amber-600";
	return "border-2 border-slate-300 bg-slate-300 text-white";
}

function labelClass(state: StepState) {
	if (state === "current") return "text-amber-700";
	if (state === "pending") return "text-slate-400";
	if (state === "rejected") return "text-rose-700";
	return "text-slate-700";
}

export default function ReservationProgressBar({ data }: ReservationProgressBarProps) {
	const computedStatus = computeReservationStatus(data.status, data.endTime);
	const steps = resolveSteps(data.flow);
	const progress = resolveProgressState(computedStatus, data.flow, steps);

	const totalSteps = steps.length;
	const current = Math.min(Math.max(progress.currentIndex, 0), totalSteps - 1);

	const progressWidth = progress.isComplete ? "100%" : `${(current / (totalSteps - 1)) * 80 + 10}%`;

	const progressColorClass = (() => {
		if (progress.isComplete) return "bg-emerald-600";
		if (progress.rejectedIndex !== null) return "bg-rose-600";
		return "bg-emerald-600";
	})();

	return (
		<div className="w-full">
			<div className="relative">
				{/* Step circles */}
				<div className="relative z-10 grid h-8 md:h-10" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
					{steps.map((step, index) => {
						const state = resolveStepState({
							stepIndex: index,
							currentIndex: current,
							rejectedIndex: progress.rejectedIndex,
							isComplete: progress.isComplete,
						});

						return (
							<div key={step.key} className="flex h-8 items-center justify-center md:h-10">
								{state === "current" ? (
									<div
										className="relative z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[11px] font-bold text-amber-600 md:h-10 md:w-10 md:text-[13px]"
										style={{ border: "3px solid #f59e0b", boxShadow: "0 0 0 2px #f59e0b, 0 0 0 5px #fef3c7" }}
									>
										{index + 1}
									</div>
								) : (
									<div className={`relative flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold md:h-10 md:w-10 md:text-[13px] ${circleClass(state)}`}>
										{state === "done" ? <Check className="h-3 w-3 md:h-3.5 md:w-3.5" /> : index + 1}
									</div>
								)}
							</div>
						);
					})}
				</div>

				{/* Track background */}
				<div className="absolute top-1/2 z-0 h-0.5 -translate-y-1/2 rounded-full bg-slate-200 md:h-1" style={{ left: "10%", right: "10%" }} aria-hidden="true" />
				{/* Track filled */}
				<div
					className={`absolute top-1/2 z-0 h-0.5 -translate-y-1/2 rounded-full md:h-1 ${progressColorClass}`}
					style={{ left: "10%", width: `calc(${progressWidth} - 10%)` }}
					aria-hidden="true"
				/>
			</div>

			{/* Labels */}
			<div className="mt-1.5 grid md:mt-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
				{steps.map((step, index) => {
					const fullLabel = step.key === "DECISION" ? resolveDecisionLabel(computedStatus) : step.label;
					const mobileLabel = step.key === "DECISION" ? resolveDecisionShortLabel(computedStatus) : step.shortLabel;
					const state = resolveStepState({
						stepIndex: index,
						currentIndex: current,
						rejectedIndex: progress.rejectedIndex,
						isComplete: progress.isComplete,
					});

					const secondary = resolveSecondaryText({ stepIndex: index, state, data, status: computedStatus, steps });

					return (
						<div key={step.key} className="px-0.5 text-center md:px-2">
							{/* Mobile label */}
							<div className={`text-[9px] font-semibold leading-tight md:hidden ${labelClass(state)}`}>
								{mobileLabel}
							</div>
							{/* Desktop label */}
							<div className={`hidden h-8 overflow-hidden text-[11px] font-semibold leading-snug whitespace-normal break-words md:block ${labelClass(state)}`}>
								{fullLabel}
							</div>
							{/* Date */}
							<div className={`mt-0.5 text-[9px] font-medium leading-tight md:mt-1 md:text-xs ${secondary.className}`}>{secondary.text}</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
