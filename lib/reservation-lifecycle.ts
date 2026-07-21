export const PENDING_RESERVATION_STATUSES = [
  "PENDING",
  "PENDING_KABAG",
  "PENDING_DEKAN",
  "PENDING_WD2",
  "PENDING_WAKIL_DEKAN_2",
  "PENDING_KAJUR",
  "PENDING_KEPALA_LAB",
] as const;

export const INACTIVE_RESERVATION_STATUSES = [
  "REJECTED",
  "REJECTED_KABAG",
  "REJECTED_DEKAN",
  "REJECTED_WD2",
  "REJECTED_KAJUR",
  "REJECTED_KEPALA_LAB",
  "REJECTED_PRIORITY",
  "COMPLETED",
  "SELESAI",
  "CANCELLED",
  "CANCELED",
] as const;

export const isActiveReservation = (reservation: { res_status: string; res_endTime: Date }, now = new Date()) => {
  const status = reservation.res_status.toUpperCase();

  if ((PENDING_RESERVATION_STATUSES as readonly string[]).includes(status)) {
    return true;
  }

  if (status === "APPROVED" || status === "DISETUJUI") {
    return reservation.res_endTime > now;
  }

  return false;
};

export const activeReservationWhere = (now = new Date()) => ({
  OR: [
    {
      res_status: {
        in: [...PENDING_RESERVATION_STATUSES],
      },
    },
    {
      res_status: {
        in: ["APPROVED", "DISETUJUI"],
      },
      res_endTime: { gt: now },
    },
  ],
});
