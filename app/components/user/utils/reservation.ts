import type { ReservationDisplayStatus, ReservationRecord } from "../riwayat/_types";
import { isDateInsideDailyReservationSlot } from "@/lib/reservation-slots";

export const buildDecisionLetterUrl = (reservationId: string) =>
  `/api/admin/decision-letter/pdf?reservationId=${encodeURIComponent(reservationId)}`;

export const extractActivityName = (value?: string | null) => {
  if (!value) return "-";
  return value.split(" - ")[0]?.trim() || "-";
};

export const isDecisionLetterReady = (status: string | null | undefined) => {
  const normalized = (status ?? "").toUpperCase();
  return (
    normalized === "APPROVED" ||
    normalized === "DISETUJUI" ||
    normalized === "COMPLETED" ||
    normalized === "SELESAI"
  );
};

const normalizeStatus = (status: string | null | undefined) => (status ?? "").toUpperCase();

const PENDING_STATUSES = new Set([
  "PENDING",
  "PENDING_KABAG",
  "PENDING_DEKAN",
  "PENDING_WD2",
  "PENDING_WAKIL_DEKAN_2",
  "PENDING_KAJUR",
  "PENDING_KEPALA_LAB",
]);

export const isPendingReservationStatus = (status: string | null | undefined) =>
  PENDING_STATUSES.has(normalizeStatus(status));

export const isRejectedReservationStatus = (status: string | null | undefined) =>
  normalizeStatus(status).startsWith("REJECT");

export const getReservationDisplayStatus = (
  reservation: Pick<ReservationRecord, "res_status" | "res_startTime" | "res_endTime">,
  now = new Date(),
): ReservationDisplayStatus => {
  const status = normalizeStatus(reservation.res_status);

  if (status === "COMPLETED" || status === "SELESAI") {
    return "COMPLETED";
  }

  if (isRejectedReservationStatus(status)) {
    return "REJECTED";
  }

  if (isPendingReservationStatus(status)) {
    return "PENDING";
  }

  if (status === "APPROVED" || status === "DISETUJUI") {
    const startTime = new Date(reservation.res_startTime).getTime();
    const endTime = new Date(reservation.res_endTime).getTime();
    const nowTime = now.getTime();

    if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
      return "APPROVED";
    }

    if (nowTime >= endTime) {
      return "COMPLETED";
    }

    if (
      isDateInsideDailyReservationSlot(
        {
          startTime: reservation.res_startTime,
          endTime: reservation.res_endTime,
        },
        now,
      )
    ) {
      return "ONGOING";
    }

    return "APPROVED";
  }

  return "PENDING";
};

export const isReservationActive = (
  reservation: Pick<ReservationRecord, "res_status" | "res_startTime" | "res_endTime">,
  now = new Date(),
) => {
  const displayStatus = getReservationDisplayStatus(reservation, now);
  return displayStatus === "PENDING" || displayStatus === "APPROVED" || displayStatus === "ONGOING";
};

const getNewestReservation = (reservations: ReservationRecord[]) =>
  reservations.reduce<ReservationRecord | null>((latest, current) => {
    if (!latest) return current;

    const currentSubmittedAt = new Date(current.res_date).getTime();
    const latestSubmittedAt = new Date(latest.res_date).getTime();

    if (currentSubmittedAt !== latestSubmittedAt) {
      return currentSubmittedAt > latestSubmittedAt ? current : latest;
    }

    return new Date(current.res_startTime).getTime() > new Date(latest.res_startTime).getTime()
      ? current
      : latest;
  }, null);

export const getActiveReservation = (reservations: ReservationRecord[], now = new Date()) => {
  const activeReservations = reservations.filter((reservation) => isReservationActive(reservation, now));
  if (activeReservations.length === 0) return null;

  return getNewestReservation(activeReservations);
};

export const getCurrentReservation = (reservations: ReservationRecord[], now = new Date()) => {
  const activeReservation = getActiveReservation(reservations, now);
  if (activeReservation) {
    return activeReservation;
  }

  const newestReservation = getNewestReservation(reservations);
  if (!newestReservation) {
    return null;
  }

  return getReservationDisplayStatus(newestReservation, now) === "REJECTED" ? newestReservation : null;
};
