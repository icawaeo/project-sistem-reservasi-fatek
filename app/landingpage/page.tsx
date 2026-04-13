"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AvailabilityModal, {
  type BuildingGroup,
  type RoomAvailability,
} from "@/app/components/user/landingpage/AvailabilityModal";
import BuildingDirectorySection, {
  type LandingBuildingCard,
} from "@/app/components/user/landingpage/BuildingDirectorySection";
import CampusMapSection, {
  type CampusMapPoint,
} from "@/app/components/user/landingpage/CampusMapSection";
import HeroSection, {
  type ReservationMode,
} from "@/app/components/user/landingpage/HeroSection";
import LandingFooter from "@/app/components/user/landingpage/LandingFooter";
import LandingNavbar from "@/app/components/user/landingpage/LandingNavbar";
import OccupiedRoomsSection, {
  type OccupiedRoomCard,
} from "@/app/components/user/landingpage/OccupiedRoomsSection";

const occupiedRooms: OccupiedRoomCard[] = [
  {
    name: "Auditorium Dekanat",
    building: "Gedung Dekanat Fakultas Teknik",
    time: "06:00 - 22:00 WITA",
  },
  {
    name: "Creative Room",
    building: "Gedung Jurusan Teknik Elektro",
    time: "09:30 - 21:00 WITA",
  },
  {
    name: "Lab Multimedia",
    building: "Gedung Laboratorium Teknik",
    time: "07:30 - 11:30 WITA",
  },
  {
    name: "JTE - 02",
    building: "Gedung Jurusan Teknik Elektro",
    time: "10:00 - 14:00 WITA",
  },
];

const buildings: LandingBuildingCard[] = [
  {
    name: "Gedung Dekanat Fakultas Teknik",
    image: "/images/building/dekanat.jpeg",
  },
  {
    name: "Gedung Jurusan Teknik Sipil",
    image: "/images/building/sipil.jpeg",
  },
  {
    name: "Gedung Jurusan Teknik Arsitektur",
    image: "/images/building/jte.jpeg",
  },
  {
    name: "Gedung Jurusan Teknik Elektro",
    image: "/images/building/jte.jpeg",
  },
  {
    name: "Gedung Jurusan Teknik Mesin",
    image: "/images/building/dekanat.jpeg",
  },
  {
    name: "Gedung Laboratorium Fakultas Teknik",
    image: "/images/building/lab.jpeg",
  },
];

const mapPoints: CampusMapPoint[] = [
  {
    name: "Gedung Jurusan Teknik Arsitektur",
    shortUrl: "https://maps.app.goo.gl/8ASpjWXVgejtJDpp8",
    embedUrl: "https://www.google.com/maps?q=1.4594425,124.8258652&z=20&output=embed",
  },
  {
    name: "Gedung Jurusan Teknik Sipil",
    shortUrl: "https://maps.app.goo.gl/Wy4THU5oW6AgfFYp6",
    embedUrl: "https://www.google.com/maps?q=1.4579273,124.8263909&z=20&output=embed",
  },
  {
    name: "Gedung Jurusan Teknik Elektro",
    shortUrl: "https://maps.app.goo.gl/RvMEgxESAGU3VdaBA",
    embedUrl: "https://www.google.com/maps?q=1.4597494,124.8260556&z=20&output=embed",
  },
  {
    name: "Gedung Dekanat Fakultas Teknik",
    shortUrl: "https://maps.app.goo.gl/bhCMCT9FgmDjqsrx9",
    embedUrl: "https://www.google.com/maps?q=1.4590842,124.8255351&z=20&output=embed",
  },
  {
    name: "Gedung Jurusan Teknik Mesin",
    shortUrl: "https://maps.app.goo.gl/wVNVkJSfc59D7PSVA",
    embedUrl: "https://www.google.com/maps?q=1.4585082,124.8256701&z=20&output=embed",
  },
  {
    name: "Gedung Laboratorium Fakultas Teknik",
    shortUrl: "https://maps.app.goo.gl/ucabMNHxz87jdxDP6",
    embedUrl: "https://www.google.com/maps?q=1.4583367,124.8255388&z=20&output=embed",
  },
];

const allMapView: CampusMapPoint = {
  name: "Lihat Semua",
  shortUrl:
    "https://www.google.com/maps/dir/?api=1&origin=1.4594425,124.8258652&destination=1.4583367,124.8255388&travelmode=walking&waypoints=1.4579273,124.8263909|1.4597494,124.8260556|1.4590842,124.8255351|1.4585082,124.8256701",
  embedUrl:
    "https://www.google.com/maps?q=Fakultas+Teknik+Universitas+Sam+Ratulangi&z=18&output=embed",
};

export default function LandingPage() {
  const { data: session } = useSession();
  const isPrivilegedStaff = session?.user?.userType === "STAFF";
  const router = useRouter();

  const [reservationMode, setReservationMode] = useState<ReservationMode>("per-day");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [availableBuildings, setAvailableBuildings] = useState<BuildingGroup[]>([]);
  const selectedRoom: RoomAvailability | null = null;

  const scheduleLabel =
    reservationMode === "date-range"
      ? `${startDate || "-"} s/d ${endDate || "-"} · ${startTime || "-"} - ${endTime || "-"}`
      : `${startDate || "-"} · ${startTime || "-"} - ${endTime || "-"}`;

  const handleRoomSelect = (room: RoomAvailability) => {
    if (!session?.user || isPrivilegedStaff) {
      router.push("/?tab=login");
      return;
    }

    const effectiveEndDate = reservationMode === "date-range" ? endDate : startDate;
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
    });

    setIsModalOpen(false);
    router.push(`/reservasi?${qp.toString()}`);
  };

  const handleSearch = async () => {
    setValidationError("");
    const OPENING_TIME = "08:00";
    const CLOSING_TIME = "18:00";

    if (!startDate || !startTime || !endTime || (reservationMode === "date-range" && !endDate)) {
      setValidationError("Lengkapi tanggal dan waktu reservasi terlebih dahulu.");
      return;
    }

    if (startTime < OPENING_TIME || endTime > CLOSING_TIME) {
      setValidationError("Tanggal dan waktu melewati jam operasional gedung (08:00 - 18:00).");
      return;
    }

    if (reservationMode === "date-range" && endDate < startDate) {
      setValidationError("End Date harus lebih besar atau sama dengan Start Date.");
      return;
    }

    if (endTime <= startTime) {
      setValidationError("End Time harus lebih besar dari Start Time.");
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
      });

      const response = await fetch(`/api/rooms?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        setValidationError(data?.error ?? "Gagal mengambil data ruangan.");
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

      const buildingGroups: BuildingGroup[] = Object.entries(grouped).map(
        ([building, groupedRooms]) => ({
          building,
          rooms: groupedRooms,
        })
      );

      setAvailableBuildings(buildingGroups);
      setIsModalOpen(true);
    } catch {
      setValidationError("Terjadi kesalahan saat mencari ruangan.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] font-sans">
      <LandingNavbar active="home" />

      <main>
        <HeroSection
          reservationMode={reservationMode}
          onReservationModeChange={(mode) => {
            setReservationMode(mode);
            if (mode === "per-day") setEndDate("");
            setValidationError("");
          }}
          startDate={startDate}
          onStartDateChange={(value) => {
            setStartDate(value);
            setValidationError("");
          }}
          endDate={endDate}
          onEndDateChange={(value) => {
            setEndDate(value);
            setValidationError("");
          }}
          startTime={startTime}
          onStartTimeChange={(value) => {
            setStartTime(value);
            setValidationError("");
          }}
          endTime={endTime}
          onEndTimeChange={(value) => {
            setEndTime(value);
            setValidationError("");
          }}
          onSearch={handleSearch}
          isSearching={isSearching}
          validationError={validationError}
          selectedRoom={selectedRoom}
        />
        <OccupiedRoomsSection rooms={occupiedRooms} />
        <BuildingDirectorySection buildings={buildings} />
        <CampusMapSection mapPoints={mapPoints} allMapView={allMapView} />
      </main>

      <LandingFooter />

      <AvailabilityModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        scheduleLabel={scheduleLabel}
        buildings={availableBuildings}
        onSelectRoom={handleRoomSelect}
      />
    </div>
  );
}