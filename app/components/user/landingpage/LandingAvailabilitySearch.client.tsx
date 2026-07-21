"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { useToast } from "@/app/components/ui/toast";
import dynamic from "next/dynamic";
import {
  type BuildingGroup,
  type RoomAvailability,
} from "@/app/components/user/landingpage/AvailabilityModal";
import HeroSection, { type ReservationMode, type ActivityType } from "@/app/components/user/landingpage/HeroSection";

const AvailabilityModal = dynamic(
  () => import("@/app/components/user/landingpage/AvailabilityModal"),
  { ssr: false }
);
import {
  DEFAULT_MIN_DAYS_AHEAD_EXCLUSIVE,
  validateReservationLeadTimeYMD,
} from "@/lib/reservation-policy";
import { isPrivilegedStaffUser } from "@/lib/role-access";

export default function LandingAvailabilitySearch() {
  const { data: session, status: sessionStatus } = useSession();
  const isPrivilegedStaff = isPrivilegedStaffUser(session?.user);
  const router = useRouter();
  const { pushToast } = useToast();

  const [reservationMode, setReservationMode] = useState<ReservationMode>("per-day");
  const [activityType, setActivityType] = useState<ActivityType>("NON_AKADEMIK");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [availableBuildings, setAvailableBuildings] = useState<BuildingGroup[]>([]);
  const [minDaysAheadExclusive, setMinDaysAheadExclusive] = useState(DEFAULT_MIN_DAYS_AHEAD_EXCLUSIVE);

  const selectedRoom: RoomAvailability | null = null;

  useEffect(() => {
    const loadPolicy = async () => {
      try {
        const response = await fetch("/api/reservation-policy", { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json();
        if (Number.isInteger(payload?.minDaysAheadExclusive)) {
          setMinDaysAheadExclusive(payload.minDaysAheadExclusive);
        }
      } catch {
        // Gunakan default lokal jika aturan gagal dimuat.
      }
    };

    void loadPolicy();
  }, []);

  const scheduleLabel = useMemo(() => {
    if (reservationMode === "date-range") {
      return `${startDate || "-"} s/d ${endDate || "-"} · ${startTime || "-"} - ${endTime || "-"}`;
    }

    return `${startDate || "-"} · ${startTime || "-"} - ${endTime || "-"}`;
  }, [endDate, endTime, reservationMode, startDate, startTime]);

  const handleRoomSelect = useCallback(
    async (room: RoomAvailability) => {
      if (sessionStatus === "loading") {
        return;
      }

      if (sessionStatus !== "authenticated" || isPrivilegedStaff) {
        router.push("/auth?tab=login");
        return;
      }

      try {
        const activeRes = await fetch("/api/reservasi/active");
        const activeData = await activeRes.json();
        if (activeData.hasActive) {
            pushToast({ type: "error", message: "Anda masih memiliki pengajuan reservasi aktif yang belum selesai." });
            return;
        }
      } catch (e) {
          // Lanjutkan jika terjadi error saat mengecek
      }

      const effectiveEndDate = reservationMode === "date-range" ? endDate : startDate;

      try {
        sessionStorage.setItem(
          "reservationDraft",
          JSON.stringify({
            room_id: room.room_id,
            room_name: room.room_name,
            room_building: room.room_building,
            room_capacity: String(room.room_capacity),
            room_locDetail: room.room_locDetail,
            room_imageUrl: room.room_imageUrl ?? "",
            startDate,
            endDate: effectiveEndDate,
            startTime,
            endTime,
            activityType,
          }),
        );
      } catch {
        // ignore (e.g. storage quota)
      }

      const qp = new URLSearchParams({
        room_id: room.room_id,
        room_name: room.room_name,
        room_building: room.room_building,
        room_capacity: String(room.room_capacity),
        room_locDetail: room.room_locDetail,
        room_imageUrl: room.room_imageUrl ?? "",
        startDate,
        endDate: effectiveEndDate,
        startTime,
        endTime,
        activityType,
      });

      setIsModalOpen(false);
      router.push(`/reservasi?${qp.toString()}`);
    },
    [endDate, isPrivilegedStaff, reservationMode, router, sessionStatus, endTime, startDate, startTime, activityType],
  );

  const handleSearch = useCallback(async () => {
    if (!startDate || !startTime || !endTime || (reservationMode === "date-range" && !endDate)) {
      pushToast({ type: "error", message: "Lengkapi tanggal dan waktu reservasi terlebih dahulu." });
      return;
    }

    const leadTimeCheck = validateReservationLeadTimeYMD(startDate, { minDaysAheadExclusive });
    if (!leadTimeCheck.ok) {
      pushToast({
        type: "error",
        message: `Reservasi hanya dapat dilakukan minimal H-${minDaysAheadExclusive}. Silakan pilih tanggal mulai ${leadTimeCheck.earliestAllowedDateYMD}.`,
      });
      return;
    }

    if (reservationMode === "date-range" && endDate < startDate) {
      pushToast({ type: "error", message: "End Date harus lebih besar atau sama dengan Start Date." });
      return;
    }

    if (endTime <= startTime) {
      pushToast({ type: "error", message: "Jam selesai tidak boleh lebih awal dari jam mulai." });
      return;
    }

    const effectiveEndDate = reservationMode === "date-range" ? endDate : startDate;

    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        startDate,
        endDate: effectiveEndDate,
        startTime,
        endTime,
        activityType,
      });

      const response = await fetch(`/api/rooms?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        pushToast({ type: "error", message: data?.error ?? "Gagal mengambil data ruangan." });
        return;
      }

      const rooms = data as RoomAvailability[];
      const grouped = rooms.reduce<Record<string, RoomAvailability[]>>((acc, room) => {
        if (!acc[room.room_building]) {
          acc[room.room_building] = [];
        }
        acc[room.room_building].push(room);
        return acc;
      }, {});

      const buildingGroups: BuildingGroup[] = Object.entries(grouped).map(([building, groupedRooms]) => ({
        building,
        rooms: groupedRooms,
      }));

      setAvailableBuildings(buildingGroups);
      setIsModalOpen(true);
    } catch {
      pushToast({ type: "error", message: "Terjadi kesalahan saat mencari ruangan." });
    } finally {
      setIsSearching(false);
    }
  }, [endDate, endTime, minDaysAheadExclusive, pushToast, reservationMode, startDate, startTime, activityType]);

  return (
    <>
      <HeroSection
        reservationMode={reservationMode}
        onReservationModeChange={(mode) => {
          setReservationMode(mode);
          if (mode === "per-day") setEndDate("");
        }}
        activityType={activityType}
        onActivityTypeChange={setActivityType}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        startTime={startTime}
        onStartTimeChange={setStartTime}
        endTime={endTime}
        onEndTimeChange={setEndTime}
        onSearch={handleSearch}
        isSearching={isSearching}
        selectedRoom={selectedRoom}
      />

      {isModalOpen && (
        <AvailabilityModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          scheduleLabel={scheduleLabel}
          buildings={availableBuildings}
          onSelectRoom={handleRoomSelect}
        />
      )}
    </>
  );
}
