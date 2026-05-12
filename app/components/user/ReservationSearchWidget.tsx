"use client";

import { Calendar, Clock, Search } from "lucide-react";

export type ReservationMode = "per-day" | "date-range";

export type SelectedRoomSummary = {
  room_name: string;
  room_building: string;
  room_capacity: number;
};

type ReservationSearchWidgetProps = {
  reservationMode: ReservationMode;
  onReservationModeChange: (mode: ReservationMode) => void;

  startDate: string;
  onStartDateChange: (value: string) => void;

  endDate: string;
  onEndDateChange: (value: string) => void;

  startTime: string;
  onStartTimeChange: (value: string) => void;

  endTime: string;
  onEndTimeChange: (value: string) => void;

  onSearch: () => void;
  isSearching: boolean;

  searchLabelIdle?: string;
  searchLabelLoading?: string;
  selectedRoom?: SelectedRoomSummary | null;
};

export default function ReservationSearchWidget({
  reservationMode,
  onReservationModeChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
  onSearch,
  isSearching,
  searchLabelIdle = "Cari Ruangan",
  searchLabelLoading = "Mencari...",
  selectedRoom = null,
}: ReservationSearchWidgetProps) {
  return (
    <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl md:shadow-2xl p-4 md:p-6 border border-slate-100 text-left w-full">
      <div className="mb-3 md:mb-4">
        <span className="text-[10px] md:text-[11px] lg:text-xs font-bold tracking-widest text-slate-500 uppercase">
          Jenis Reservasi
        </span>
        <div className="mt-1.5 md:mt-2 flex flex-wrap items-center gap-3 md:gap-4">
          <label className="inline-flex items-center gap-2 text-xs md:text-sm lg:text-base text-slate-700">
            <input
              type="radio"
              name="reservation-mode"
              value="per-day"
              checked={reservationMode === "per-day"}
              onChange={() => onReservationModeChange("per-day")}
              className="h-4 w-4 accent-slate-900"
            />
            Harian
          </label>
          <label className="inline-flex items-center gap-2 text-xs md:text-sm lg:text-base text-slate-700">
            <input
              type="radio"
              name="reservation-mode"
              value="date-range"
              checked={reservationMode === "date-range"}
              onChange={() => onReservationModeChange("date-range")}
              className="h-4 w-4 accent-slate-900"
            />
            Rentang Hari
          </label>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end gap-3 md:gap-4">
        <div className="flex-1 min-w-0">
          <label className="text-[10px] md:text-[11px] lg:text-xs font-bold tracking-widest text-slate-500 uppercase">
            {reservationMode === "per-day" ? "Tanggal" : "Tanggal Mulai"}
          </label>
          <div className="mt-1 flex items-center gap-2 border-b border-slate-200 pb-1">
            <Calendar size={14} className="text-slate-400 shrink-0" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="text-xs md:text-sm lg:text-base text-slate-600 outline-none w-full bg-transparent appearance-none cursor-pointer min-w-0 py-0.5 md:py-1"
            />
          </div>
        </div>

        {reservationMode === "date-range" && (
          <div className="flex-1 min-w-0">
            <label className="text-[10px] md:text-[11px] lg:text-xs font-bold tracking-widest text-slate-500 uppercase">
              Tanggal Selesai
            </label>
            <div className="mt-1 flex items-center gap-2 border-b border-slate-200 pb-1">
              <Calendar size={14} className="text-slate-400 shrink-0" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="text-xs md:text-sm lg:text-base text-slate-600 outline-none w-full bg-transparent appearance-none cursor-pointer min-w-0 py-0.5 md:py-1"
              />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <label className="text-[10px] md:text-[11px] lg:text-xs font-bold tracking-widest text-slate-500 uppercase">
            Waktu Mulai
          </label>
          <div className="mt-1 flex items-center gap-2 border-b border-slate-200 pb-1">
            <Clock size={14} className="text-slate-400 shrink-0" />
            <input
              type="time"
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              className="text-xs md:text-sm lg:text-base text-slate-600 outline-none w-full bg-transparent appearance-none cursor-pointer min-w-0 py-0.5 md:py-1"
            />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <label className="text-[10px] md:text-[11px] lg:text-xs font-bold tracking-widest text-slate-500 uppercase">
            Waktu Selesai
          </label>
          <div className="mt-1 flex items-center gap-2 border-b border-slate-200 pb-1">
            <Clock size={14} className="text-slate-400 shrink-0" />
            <input
              type="time"
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              className="text-xs md:text-sm lg:text-base text-slate-600 outline-none w-full bg-transparent appearance-none cursor-pointer min-w-0 py-0.5 md:py-1"
            />
          </div>
        </div>

        <div className="shrink-0 md:self-end">
          <button
            onClick={onSearch}
            disabled={isSearching}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white rounded-xl px-4 py-2.5 md:px-6 md:py-3 text-xs md:text-sm lg:text-base font-semibold hover:bg-slate-700 transition-all shadow-lg shadow-slate-900/20 whitespace-nowrap disabled:cursor-not-allowed disabled:bg-slate-500 mt-2 md:mt-0"
            type="button"
          >
            <Search size={15} />
            {isSearching ? searchLabelLoading : searchLabelIdle}
          </button>
        </div>
      </div>

      {selectedRoom ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-xs md:text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Ruangan Dipilih
          </p>
          <div className="mt-1 flex flex-col gap-1 text-sm md:text-base text-slate-700 md:flex-row md:items-center md:justify-between">
            <p className="font-semibold text-slate-900">{selectedRoom.room_name}</p>
            <p className="text-xs md:text-sm text-slate-600">
              {selectedRoom.room_building} · Kapasitas {selectedRoom.room_capacity} Orang
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
