"use client";

import { Loader2 } from "lucide-react";

import { WEEKDAY_LABELS } from "./constants";
import type { HolidayEvent, ScheduleItem } from "./types";
import { formatCellDateLabel, getScheduleStyle } from "./utils";

type CalendarDay = {
  date: Date;
  ymd: string;
  isCurrentMonth: boolean;
};

type Props = {
  calendarDays: CalendarDay[];
  schedulesByDate: Record<string, ScheduleItem[]>;
  holidaysByDate: Record<string, HolidayEvent[]>;
  holidayCalendarError: string | null;
  isLoading: boolean;
  getDisabledReason?: (day: CalendarDay) => string | null;
  onCreateSchedule: (date: string) => void;
  onEditSchedule: (item: ScheduleItem) => void;
  onInspectDate: (date: string) => void;
};

export default function ScheduleCalendarGrid({
  calendarDays,
  schedulesByDate,
  holidaysByDate,
  holidayCalendarError,
  isLoading,
  getDisabledReason,
  onCreateSchedule,
  onEditSchedule,
  onInspectDate,
}: Props) {
  return (
    <section className="overflow-hidden border-t border-slate-200 bg-white lg:h-[calc(100dvh-145px)]">
      <div
        className="relative h-full border-l border-slate-200"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          gridAutoRows: "minmax(82px, 1fr)",
        }}
      >
        {calendarDays.map((day, index) => {
          const dayIndex = day.date.getDay();
          const daySchedules = schedulesByDate[day.ymd] ?? [];
          const dayHolidays = holidaysByDate[day.ymd] ?? [];
          const hasHoliday = dayHolidays.length > 0;
          const visibleItemsCount = dayHolidays.length + Math.min(daySchedules.length, 1);
          const disabledReason = getDisabledReason?.(day) ?? null;
          const isDisabled = Boolean(disabledReason);

          return (
            <div
              key={day.ymd}
              onClick={() => {
                if (!isDisabled) onCreateSchedule(day.ymd);
              }}
              className={`min-h-24 overflow-hidden border-b border-r border-slate-200 px-2 py-2 transition-colors ${
                isDisabled ? "cursor-not-allowed bg-slate-100 text-slate-400" : "cursor-pointer bg-white hover:bg-slate-50"
              }`}
              title={disabledReason ?? undefined}
              aria-disabled={isDisabled ? true : undefined}
            >
              <div className="flex flex-col items-center gap-1">
                {index < 7 ? (
                  <span className={`text-xs font-semibold ${isDisabled ? "text-slate-400" : "text-slate-900"}`}>
                    {WEEKDAY_LABELS[dayIndex]}
                  </span>
                ) : null}
                <span
                  className={`text-sm font-medium ${
                    isDisabled ? "text-slate-400" : hasHoliday ? "text-rose-700" : day.isCurrentMonth ? "text-black" : "text-slate-700"
                  }`}
                >
                  {formatCellDateLabel(day.date)}
                </span>
                {isDisabled && index >= 7 ? <span className="text-[10px] font-medium text-slate-400">Tutup</span> : null}
              </div>

              <div className="mt-1.5 space-y-1">
                {dayHolidays.slice(0, 1).map((holiday) => (
                  <div
                    key={`${holiday.date}-${holiday.title}`}
                    className="flex h-6 items-center gap-1.5 overflow-hidden rounded bg-rose-50 pl-2 pr-1 text-left"
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-rose-500 bg-white" />
                    <span className="truncate text-xs font-normal text-slate-900">{holiday.title}</span>
                  </div>
                ))}
                {daySchedules.slice(0, 1).map((item) => {
                  const style = getScheduleStyle(item.type);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEditSchedule(item);
                      }}
                      className={`group flex h-6 w-full items-center gap-1.5 overflow-hidden rounded pl-2 pr-1 text-left ${style.card}`}
                    >
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-slate-500 bg-white" />
                      <span className={`truncate text-xs font-normal ${style.text}`}>{item.title}</span>
                    </button>
                  );
                })}
                {daySchedules.length + Math.max(dayHolidays.length - 1, 0) > 1 ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onInspectDate(day.ymd);
                    }}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800"
                  >
                    +{daySchedules.length + Math.max(dayHolidays.length - 1, 0) - 1} more
                  </button>
                ) : null}
                {visibleItemsCount === 0 && holidayCalendarError && index === 0 ? (
                  <div className="truncate text-xs font-medium text-rose-600">{holidayCalendarError}</div>
                ) : null}
              </div>
            </div>
          );
        })}

        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <div className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
              <Loader2 size={16} className="animate-spin" />
              Memuat jadwal...
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
