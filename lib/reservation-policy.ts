export type ReservationLeadTimeValidationResult =
  | { ok: true }
  | { ok: false; reason: "invalid-date" | "too-soon"; earliestAllowedDateYMD: string };

const DAY_MS = 24 * 60 * 60 * 1000;

// Business rule (per request example): user cannot reserve within the next 3 days (inclusive).
// If today is 25, then 26/27/28 are rejected; earliest allowed is 29.
export const DEFAULT_MIN_DAYS_AHEAD_EXCLUSIVE = 3;

const isYmd = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export const startOfLocalDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const formatDateYMD = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseYMDToLocalDate = (ymd: string) => {
  if (!isYmd(ymd)) return null;
  const parsed = new Date(`${ymd}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const validateReservationLeadTimeYMD = (
  reservationDateYMD: string,
  options?: {
    now?: Date;
    minDaysAheadExclusive?: number;
  },
): ReservationLeadTimeValidationResult => {
  const now = options?.now ?? new Date();
  const minDaysAheadExclusive = options?.minDaysAheadExclusive ?? DEFAULT_MIN_DAYS_AHEAD_EXCLUSIVE;

  const reservationDate = parseYMDToLocalDate(reservationDateYMD);
  if (!reservationDate) {
    return {
      ok: false,
      reason: "invalid-date",
      earliestAllowedDateYMD: formatDateYMD(startOfLocalDay(now)),
    };
  }

  const today = startOfLocalDay(now);
  const earliestAllowed = new Date(today.getTime() + (minDaysAheadExclusive + 1) * DAY_MS);
  const reservationDay = startOfLocalDay(reservationDate);

  if (reservationDay < earliestAllowed) {
    return {
      ok: false,
      reason: "too-soon",
      earliestAllowedDateYMD: formatDateYMD(earliestAllowed),
    };
  }

  return { ok: true };
};

export const validateReservationLeadTimeDate = (
  reservationStart: Date,
  options?: {
    now?: Date;
    minDaysAheadExclusive?: number;
  },
): ReservationLeadTimeValidationResult => {
  if (Number.isNaN(reservationStart.getTime())) {
    return {
      ok: false,
      reason: "invalid-date",
      earliestAllowedDateYMD: formatDateYMD(startOfLocalDay(options?.now ?? new Date())),
    };
  }

  const reservationDay = startOfLocalDay(reservationStart);
  return validateReservationLeadTimeYMD(formatDateYMD(reservationDay), options);
};
