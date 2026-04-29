"use client";

import Image from "next/image";
import type { RoomAvailability } from "./AvailabilityModal";
import ReservationSearchWidget, {
  type ReservationMode,
  type SelectedRoomSummary,
} from "@/app/components/user/ReservationSearchWidget";

export type { ReservationMode } from "@/app/components/user/ReservationSearchWidget";

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
  const selectedRoomSummary: SelectedRoomSummary | null = selectedRoom
    ? {
        room_name: selectedRoom.room_name,
        room_building: selectedRoom.room_building,
        room_capacity: selectedRoom.room_capacity,
      }
    : null;

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
          <ReservationSearchWidget
            reservationMode={reservationMode}
            onReservationModeChange={onReservationModeChange}
            startDate={startDate}
            onStartDateChange={onStartDateChange}
            endDate={endDate}
            onEndDateChange={onEndDateChange}
            startTime={startTime}
            onStartTimeChange={onStartTimeChange}
            endTime={endTime}
            onEndTimeChange={onEndTimeChange}
            onSearch={onSearch}
            isSearching={isSearching}
            searchLabelIdle="Cari Ruangan"
            searchLabelLoading="Mencari..."
            selectedRoom={selectedRoomSummary}
          />
        </div>
      </div>
    </section>
  );
}
