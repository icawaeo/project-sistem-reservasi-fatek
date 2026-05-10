import type { ReservationRecord } from "../riwayat/_types";

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

export const isReservationActive = (reservation: { res_status: string; res_endTime: string | Date }) => {
  const status = (reservation.res_status || "").toUpperCase();
  if (status === "PENDING") return true;
  if (status === "APPROVED") {
    return new Date(reservation.res_endTime).getTime() > Date.now();
  }
  return false;
};

export const getActiveReservation = (reservations: ReservationRecord[]) => {
  const activeReservations = reservations.filter(isReservationActive);
  if (activeReservations.length === 0) return null;

  return activeReservations.reduce((latest, current) =>
    new Date(current.res_startTime).getTime() > new Date(latest.res_startTime).getTime()
      ? current
      : latest
  );
};
