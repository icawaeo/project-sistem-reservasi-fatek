export type BuildingOperationalSchedule = {
  operational_days: string[];
  open_time: string;
  close_time: string;
};

type ValidateBuildingOperationalWindowInput = {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  schedule: BuildingOperationalSchedule;
};

type BuildingOperationalValidationResult =
  | { ok: true }
  | { ok: false; error: string };

const INDONESIAN_WEEKDAYS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;

const normalizeWeekday = (value: string) => value.trim().toLowerCase();

const getDateRange = (startDate: string, endDate: string) => {
  const dates: string[] = [];
  const current = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(current.getTime()) || Number.isNaN(end.getTime()) || end < current) {
    return [];
  }

  while (current <= end) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, "0");
    const dd = String(current.getDate()).padStart(2, "0");
    dates.push(`${yyyy}-${mm}-${dd}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

const getWeekdayLabel = (dateYmd: string) => {
  const parsed = new Date(`${dateYmd}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return INDONESIAN_WEEKDAYS[parsed.getDay()];
};

export const formatBuildingOperationalHours = (schedule: BuildingOperationalSchedule) =>
  `${schedule.open_time} - ${schedule.close_time}`;

export const validateBuildingOperationalWindow = ({
  startDate,
  endDate,
  startTime,
  endTime,
  schedule,
}: ValidateBuildingOperationalWindowInput): BuildingOperationalValidationResult => {
  const dates = getDateRange(startDate, endDate);
  if (dates.length === 0) {
    return { ok: false, error: "Rentang tanggal reservasi tidak valid." };
  }

  if (startTime < schedule.open_time || endTime > schedule.close_time) {
    return {
      ok: false,
      error: `Waktu peminjaman melewati jam operasional gedung (${formatBuildingOperationalHours(schedule)}).`,
    };
  }

  const allowedDays = new Set(schedule.operational_days.map(normalizeWeekday));
  const invalidDate = dates.find((date) => {
    const weekday = getWeekdayLabel(date);
    return !weekday || !allowedDays.has(normalizeWeekday(weekday));
  });

  if (invalidDate) {
    const weekday = getWeekdayLabel(invalidDate);
    return {
      ok: false,
      error: weekday
        ? `Gedung tidak beroperasi pada hari ${weekday}.`
        : "Tanggal reservasi berada di luar hari operasional gedung.",
    };
  }

  return { ok: true };
};
