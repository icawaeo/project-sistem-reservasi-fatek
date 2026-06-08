"use client";

import { Plus, X } from "lucide-react";

import type { ScheduleItem } from "./types";
import { formatFullDate, formatTimeRange, getScheduleStyle } from "./utils";

type Props = {
  inspectingDate: string;
  schedules: ScheduleItem[];
  onClose: () => void;
  onEditSchedule: (item: ScheduleItem) => void;
  onCreateSchedule: (date: string) => void;
};

export default function ScheduleDateSchedulesModal({
  inspectingDate,
  schedules,
  onClose,
  onEditSchedule,
  onCreateSchedule,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Jadwal {formatFullDate(inspectingDate)}</h3>
            <p className="text-sm text-slate-500">Pilih jadwal untuk mengubah atau menghapus data.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[70dvh] space-y-2 overflow-y-auto px-5 py-4">
          {schedules.map((item) => {
            const style = getScheduleStyle(item.type);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onClose();
                  onEditSchedule(item);
                }}
                className={`relative w-full rounded-lg px-4 py-3 text-left ${style.card}`}
              >
                <span className={`absolute inset-y-0 left-0 w-1 rounded-l-lg ${style.border}`} />
                <span className={`block text-sm font-semibold ${style.text}`}>{item.title}</span>
                <span className={`mt-0.5 block text-xs font-normal ${style.text}`}>
                  {formatTimeRange(item)} | {item.room.name}
                </span>
              </button>
            );
          })}
        </div>

        <div className="border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              onCreateSchedule(inspectingDate);
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            <Plus size={15} />
            Tambah Jadwal di Tanggal Ini
          </button>
        </div>
      </div>
    </div>
  );
}
