export const COMPLETED_STATUS = "COMPLETED" as const;

export function computeReservationStatus(rawStatus: string, endTimeInput: string | Date, now = new Date()): string {
  const normalized = rawStatus.toUpperCase();
  const endTime = endTimeInput instanceof Date ? endTimeInput : new Date(endTimeInput);

  if (Number.isNaN(endTime.getTime())) {
    return rawStatus;
  }

  const isApproved = normalized === "APPROVED" || normalized === "DISETUJUI";
  if (isApproved && endTime.getTime() < now.getTime()) {
    return COMPLETED_STATUS;
  }

  return rawStatus;
}

export type ReservationStatusGroup = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | "CANCELLED" | "UNKNOWN";

export function resolveReservationStatusGroup(status: string): ReservationStatusGroup {
  const normalized = (status ?? "").toUpperCase();

  if (normalized === "COMPLETED" || normalized === "SELESAI") {
    return "COMPLETED";
  }

  if (normalized === "APPROVED" || normalized === "DISETUJUI") {
    return "APPROVED";
  }

  if (normalized.startsWith("PENDING") || normalized.includes("MENUNGGU")) {
    return "PENDING";
  }

  if (normalized.startsWith("REJECT") || normalized.includes("DITOLAK")) {
    return "REJECTED";
  }

  if (normalized.startsWith("CANCEL") || normalized.includes("DIBATALKAN")) {
    return "CANCELLED";
  }

  return "UNKNOWN";
}
