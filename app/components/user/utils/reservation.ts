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

export const getLatestPendingReservation = (reservations: ReservationRecord[]) => {
  const pending = reservations.filter((item) => item.res_status === "PENDING");
  if (pending.length === 0) return null;

  return pending.reduce((latest, current) =>
    new Date(current.res_startTime).getTime() > new Date(latest.res_startTime).getTime()
      ? current
      : latest
  );
};
