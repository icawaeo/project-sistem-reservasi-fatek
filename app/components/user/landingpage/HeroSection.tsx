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
    <section className="relative min-h-dvh">
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
        className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col items-center justify-center gap-10 px-4 py-28 text-center"
      >
        <div>
          <h1
            className="text-5xl md:text-[3.5rem] lg:text-6xl text-balance font-black leading-[0.95] tracking-tight text-white"
          >
            Sistem Reservasi Ruangan
          </h1>
          <p
            className="mt-3 text-lg md:text-xl max-w-2xl text-white/70"
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
