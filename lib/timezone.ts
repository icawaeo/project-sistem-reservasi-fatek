const WITA_TIME_ZONE = "Asia/Makassar";

const witaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: WITA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const witaDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: WITA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const getPart = (parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) =>
  parts.find((part) => part.type === type)?.value ?? "";

export const parseWitaDateTime = (dateYmd: string, timeHm: string) => {
  const parsed = new Date(`${dateYmd}T${timeHm}:00+08:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatWitaDateYMD = (date: Date) => witaDateFormatter.format(date);

export const getWitaDateTimeParts = (date: Date) => {
  const parts = witaDateTimeFormatter.formatToParts(date);
  const hour = getPart(parts, "hour");

  return {
    date: `${getPart(parts, "year")}-${getPart(parts, "month")}-${getPart(parts, "day")}`,
    time: `${hour === "24" ? "00" : hour}:${getPart(parts, "minute")}`,
  };
};
