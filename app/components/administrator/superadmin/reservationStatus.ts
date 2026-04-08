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
