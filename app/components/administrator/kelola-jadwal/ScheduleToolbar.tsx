"use client";

import { ChevronLeft, ChevronRight, Filter, Plus } from "lucide-react";

import type { RoomOption } from "./types";
import { formatMonthTitle } from "./utils";

type Props = {
  monthKey: string;
  rooms: RoomOption[];
  selectedRoomFilter: string;
  isFilterOpen: boolean;
  onShiftMonth: (delta: number) => void;
  onToggleFilter: () => void;
  onRoomFilterChange: (roomId: string) => void;
  onCreateSchedule: () => void;
};

export default function ScheduleToolbar({
  monthKey,
  rooms,
  selectedRoomFilter,
  isFilterOpen,
  onShiftMonth,
  onToggleFilter,
  onRoomFilterChange,
  onCreateSchedule,
}: Props) {
  return (
    <header className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between">
      <div
        className="grid items-center gap-2"
        style={{ gridTemplateColumns: "40px minmax(176px, 1fr) 40px" }}
      >
        <button
          type="button"
          onClick={() => onShiftMonth(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-800 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-100 hover:text-slate-950"
          aria-label="Bulan sebelumnya"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-center text-xl font-semibold text-slate-950">{formatMonthTitle(monthKey)}</h2>
        <button
          type="button"
          onClick={() => onShiftMonth(1)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-800 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-100 hover:text-slate-950"
          aria-label="Bulan berikutnya"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={onToggleFilter}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            aria-label="Filter ruangan"
          >
            <Filter size={16} />
          </button>

          {isFilterOpen ? (
            <div className="absolute right-0 top-12 z-20 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
              <label className="block space-y-1">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Filter Ruangan</span>
                <select
                  value={selectedRoomFilter}
                  onChange={(event) => onRoomFilterChange(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
                >
                  <option value="">Semua ruangan</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onCreateSchedule}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 active:bg-slate-950"
        >
          <Plus size={17} />
          Tambah Jadwal
        </button>
      </div>
    </header>
  );
}
