"use client";

import Image from "next/image";
import { Calendar, Clock, Search } from "lucide-react";
import type { RoomAvailability } from "./AvailabilityModal";

export type ReservationMode = "per-day" | "date-range";

type HeroSectionProps = {
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
  selectedRoom: RoomAvailability | null;
};

export default function HeroSection({
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
  selectedRoom,
}: HeroSectionProps) {
  return (
    <section className="relative" style={{ minHeight: "100dvh" }}>
      <div className="absolute inset-0 overflow-hidden bg-linear-to-br from-slate-700 via-slate-600 to-slate-800">
        <Image
          src="/hero.jpeg"
          alt="Gedung Fakultas Teknik"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/85 via-black/65 to-black/85 backdrop-blur-sm" />
      </div>

      <div
        className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-10 px-4 py-28 text-center"
        style={{ minHeight: "100dvh" }}
      >
        <div>
          <h1
            style={{ fontSize: "clamp(3rem, 7vw, 3rem)" }}
            className="text-balance font-black leading-[0.95] tracking-tight text-white"
          >
            Sistem Reservasi Ruangan
          </h1>
          <p
            style={{ fontSize: "clamp(1.125rem, 2.2vw, 1.25rem)" }}
            className="mt-3 max-w-2xl text-white/70"
          >
            Cari dan pinjam ruangan untuk kegiatan akademik dan organisasi dengan mudah.
          </p>
        </div>

        <div className="z-20 mt-10 w-full max-w-4xl md:mt-14">
          <div className="bg-white rounded-2xl shadow-2xl px-6 py-6 border border-slate-100 text-left">
            <div className="mb-4 flex flex-wrap items-center gap-4">
            <span className="text-[10px] md:text-[11px] lg:text-xs font-bold tracking-widest text-slate-500 uppercase">
              Reservation Mode
            </span>
            <label className="inline-flex items-center gap-2 text-sm md:text-base text-slate-700">
              <input
                type="radio"
                name="reservation-mode"
                value="per-day"
                checked={reservationMode === "per-day"}
                onChange={() => onReservationModeChange("per-day")}
                className="h-4 w-4 accent-slate-900"
              />
              Per Day
            </label>
            <label className="inline-flex items-center gap-2 text-sm md:text-base text-slate-700">
              <input
                type="radio"
                name="reservation-mode"
                value="date-range"
                checked={reservationMode === "date-range"}
                onChange={() => onReservationModeChange("date-range")}
                className="h-4 w-4 accent-slate-900"
              />
              Date Range
            </label>
          </div>

          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1 min-w-0">
              <label className="text-[10px] md:text-[11px] lg:text-xs font-bold tracking-widest text-slate-500 uppercase">
                {reservationMode === "per-day" ? "Date" : "Start Date"}
              </label>
              <div className="mt-1 flex items-center gap-2 border-b border-slate-200 pb-1">
                <Calendar size={14} className="text-slate-400 shrink-0" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="text-sm md:text-base text-slate-600 outline-none w-full bg-transparent appearance-none cursor-pointer min-w-0"
                />
              </div>
            </div>

            {reservationMode === "date-range" && (
              <div className="flex-1 min-w-0">
                <label className="text-[10px] md:text-[11px] lg:text-xs font-bold tracking-widest text-slate-500 uppercase">
                  End Date
                </label>
                <div className="mt-1 flex items-center gap-2 border-b border-slate-200 pb-1">
                  <Calendar size={14} className="text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    className="text-sm md:text-base text-slate-600 outline-none w-full bg-transparent appearance-none cursor-pointer min-w-0"
                  />
                </div>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <label className="text-[10px] md:text-[11px] lg:text-xs font-bold tracking-widest text-slate-500 uppercase">
                Start Time
              </label>
              <div className="mt-1 flex items-center gap-2 border-b border-slate-200 pb-1">
                <Clock size={14} className="text-slate-400 shrink-0" />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => onStartTimeChange(e.target.value)}
                  className="text-sm md:text-base text-slate-600 outline-none w-full bg-transparent appearance-none cursor-pointer min-w-0"
                />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <label className="text-[10px] md:text-[11px] lg:text-xs font-bold tracking-widest text-slate-500 uppercase">
                End Time
              </label>
              <div className="mt-1 flex items-center gap-2 border-b border-slate-200 pb-1">
                <Clock size={14} className="text-slate-400 shrink-0" />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => onEndTimeChange(e.target.value)}
                  className="text-sm md:text-base text-slate-600 outline-none w-full bg-transparent appearance-none cursor-pointer min-w-0"
                />
              </div>
            </div>

            <div className="shrink-0 md:self-end">
              <button
                onClick={onSearch}
                disabled={isSearching}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white rounded-xl px-6 py-3 text-sm md:text-base font-semibold hover:bg-slate-700 transition-all shadow-lg shadow-slate-900/20 whitespace-nowrap disabled:cursor-not-allowed disabled:bg-slate-500"
                type="button"
              >
                <Search size={15} />
                {isSearching ? "Mencari..." : "Cari Ruangan"}
              </button>
            </div>
          </div>

          {selectedRoom && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs md:text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Ruangan Dipilih
              </p>
              <div className="mt-1 flex flex-col gap-1 text-sm md:text-base text-slate-700 md:flex-row md:items-center md:justify-between">
                <p className="font-semibold text-slate-900">
                  {selectedRoom.room_name}
                </p>
                <p className="text-xs md:text-sm text-slate-600">
                  {selectedRoom.room_building} · Kapasitas{" "}
                  {selectedRoom.room_capacity} Orang
                </p>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </section>
  );
}
