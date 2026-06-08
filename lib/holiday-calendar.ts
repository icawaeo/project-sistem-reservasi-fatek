import "server-only";

export type HolidayCalendarEvent = {
  date: string;
  title: string;
};

type HolidayCalendarCache = {
  expiresAt: number;
  events: HolidayCalendarEvent[];
};

const DEFAULT_INDONESIA_HOLIDAY_ICS_URL =
  "https://calendar.google.com/calendar/ical/en.indonesian%23holiday%40group.v.calendar.google.com/public/basic.ics";

const DEFAULT_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
let cache: HolidayCalendarCache | null = null;
let lastFetchError: string | null = null;

const getHolidayCalendarUrl = () =>
  process.env.HOLIDAY_CALENDAR_ICS_URL?.trim() ||
  process.env.GOOGLE_HOLIDAY_CALENDAR_ICS_URL?.trim() ||
  DEFAULT_INDONESIA_HOLIDAY_ICS_URL;

export function getHolidayCalendarStatus() {
  return {
    enabled: process.env.HOLIDAY_CALENDAR_ENABLED !== "false",
    required: process.env.HOLIDAY_CALENDAR_REQUIRED === "true",
    sourceUrl: getHolidayCalendarUrl(),
    lastFetchError,
  };
}

const unfoldIcsLines = (text: string) => {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const unfolded: string[] = [];

  for (const line of lines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.slice(1);
    } else {
      unfolded.push(line);
    }
  }

  return unfolded;
};

const unescapeIcsText = (value: string) =>
  value
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();

const toDateYmd = (rawValue: string) => {
  const value = rawValue.trim();
  const match = value.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
};

function parseHolidayIcs(text: string): HolidayCalendarEvent[] {
  const lines = unfoldIcsLines(text);
  const events: HolidayCalendarEvent[] = [];
  let inEvent = false;
  let date: string | null = null;
  let title = "";

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      date = null;
      title = "";
      continue;
    }

    if (line === "END:VEVENT") {
      if (inEvent && date && title) {
        events.push({ date, title });
      }
      inEvent = false;
      continue;
    }

    if (!inEvent) continue;

    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).split(";")[0];
    const value = line.slice(separatorIndex + 1);

    if (key === "DTSTART") {
      date = toDateYmd(value);
    } else if (key === "SUMMARY") {
      title = unescapeIcsText(value);
    }
  }

  return events.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

async function fetchHolidayEvents() {
  const status = getHolidayCalendarStatus();
  if (!status.enabled) return [];

  const response = await fetch(status.sourceUrl, {
    cache: "no-store",
    headers: {
      Accept: "text/calendar,text/plain,*/*",
    },
  });

  if (!response.ok) {
    throw new Error(`Gagal membaca kalender tanggal merah (${response.status}).`);
  }

  return parseHolidayIcs(await response.text());
}

export async function getHolidayCalendarEvents() {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.events;
  }

  try {
    const events = await fetchHolidayEvents();
    lastFetchError = null;
    cache = {
      expiresAt: now + Number(process.env.HOLIDAY_CALENDAR_CACHE_TTL_MS ?? DEFAULT_CACHE_TTL_MS),
      events,
    };
    return events;
  } catch (error) {
    lastFetchError = error instanceof Error ? error.message : "Gagal membaca kalender tanggal merah.";
    if (cache) return cache.events;
    if (process.env.HOLIDAY_CALENDAR_REQUIRED === "true") throw error;
    return [];
  }
}

export async function getHolidayEventsBetween(startDate: string, endDate: string) {
  const events = await getHolidayCalendarEvents();
  return events.filter((event) => event.date >= startDate && event.date <= endDate);
}

export async function validateNotHolidayRange(startDate: string, endDate: string) {
  const holidays = await getHolidayEventsBetween(startDate, endDate);
  if (holidays.length === 0) {
    return { ok: true as const, holidays: [] as HolidayCalendarEvent[] };
  }

  const first = holidays[0];
  return {
    ok: false as const,
    holidays,
    error: `Pengajuan tidak dapat dilakukan pada tanggal merah/libur nasional (${first.date}: ${first.title}).`,
  };
}
