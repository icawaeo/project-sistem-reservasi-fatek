import { DEPARTMENT_BUILDING_SCOPE } from "@/lib/room-scope";

import { TYPE_STYLE } from "./constants";
import type { HolidayEvent, RoomOption, ScheduleItem } from "./types";

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const shortMonthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
const fullDateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const INDONESIAN_WEEKDAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;
const WEEKDAY_ALIASES: Record<string, string> = {
  minggu: "minggu",
  sunday: "minggu",
  sun: "minggu",
  senin: "senin",
  monday: "senin",
  mon: "senin",
  selasa: "selasa",
  tuesday: "selasa",
  tue: "selasa",
  rabu: "rabu",
  wednesday: "rabu",
  wed: "rabu",
  kamis: "kamis",
  thursday: "kamis",
  thu: "kamis",
  jumat: "jumat",
  "jum'at": "jumat",
  friday: "jumat",
  fri: "jumat",
  sabtu: "sabtu",
  saturday: "sabtu",
  sat: "sabtu",
};

const normalizeWeekday = (value: string) => WEEKDAY_ALIASES[value.trim().toLowerCase()] ?? value.trim().toLowerCase();

export function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getDateYmd(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function getIndonesianWeekday(date: Date) {
  return INDONESIAN_WEEKDAYS[date.getDay()];
}

export function isDateOperational(date: Date, operationalDays: string[]) {
  const allowedDays = new Set(operationalDays.map(normalizeWeekday));
  return allowedDays.has(normalizeWeekday(getIndonesianWeekday(date)));
}

export function buildCalendarDays(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      ymd: getDateYmd(date),
      isCurrentMonth: date.getMonth() === month - 1,
    };
  });
}

export function getRoomProgramOptions(room: RoomOption | null) {
  if (!room) return [];
  if (room.labProgram) return [room.labProgram];
  return DEPARTMENT_BUILDING_SCOPE[room.building]?.programs ?? [];
}

export function formatMonthTitle(monthKey: string) {
  return monthFormatter.format(new Date(`${monthKey}-01T00:00:00`)).replace(" ", ", ");
}

export function formatTimeRange(item: ScheduleItem) {
  return `${item.startTime}-${item.endTime}`;
}

export function formatCellDateLabel(date: Date) {
  return date.getDate() === 1 ? `${shortMonthFormatter.format(date)} ${date.getDate()}` : String(date.getDate());
}

export function formatFullDate(dateYmd: string) {
  return fullDateFormatter.format(new Date(`${dateYmd}T00:00:00`));
}

export function getScheduleStyle(type: string) {
  return TYPE_STYLE[type] ?? TYPE_STYLE.BLOKIR_MANUAL;
}

export function groupSchedulesByDate(schedules: ScheduleItem[]) {
  return schedules.reduce<Record<string, ScheduleItem[]>>((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {});
}

export function groupHolidaysByDate(holidays: HolidayEvent[]) {
  return holidays.reduce<Record<string, HolidayEvent[]>>((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {});
}
