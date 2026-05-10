import { prisma } from "@/lib/prisma";
import Navbar from "@/app/components/layout/Navbar";
import BuildingDirectorySection, { LandingBuildingCard } from "@/app/components/user/landingpage/BuildingDirectorySection";
import CampusMapSection from "@/app/components/user/landingpage/CampusMapSection";
import LandingFooter from "@/app/components/user/landingpage/LandingFooter";
import OccupiedRoomsSection, { OccupiedRoomCard } from "@/app/components/user/landingpage/OccupiedRoomsSection";

import LandingAvailabilitySearch from "../components/user/landingpage/LandingAvailabilitySearch.client";
import { allMapView, mapPoints } from "../components/user/data/landingpage-data";

export default async function LandingPage() {
  const [dbBuildings, dbRooms] = await Promise.all([
    prisma.building.findMany({ where: { building_isActive: true } }),
    prisma.room.findMany({ where: { room_isActive: true } }),
  ]);

  const buildings: LandingBuildingCard[] = dbBuildings.map((b) => {
    const roomCount = dbRooms.filter((r) => r.room_building === b.building_name).length;
    return {
      name: b.building_name,
      image: b.building_imageUrl || "/hero.jpeg",
      roomsLabel: `${roomCount} RUANGAN`,
    };
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayReservations = await prisma.reservation.findMany({
    where: {
      res_status: "APPROVED",
      res_date: {
        gte: today,
        lt: tomorrow,
      },
    },
    include: {
      room: true,
    },
    take: 10,
  });

  const occupiedRooms: OccupiedRoomCard[] = todayReservations.map((res) => {
    const formatTime = (d: Date) => d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    return {
      name: res.room.room_name,
      building: res.room.room_building,
      activity: res.res_purpose,
      time: `${formatTime(res.res_startTime)} - ${formatTime(res.res_endTime)} WITA`,
    };
  });

  return (
    <div className="min-h-screen bg-[#f5f5f0] font-sans">
      <Navbar />

      <main>
        <LandingAvailabilitySearch />
        <OccupiedRoomsSection rooms={occupiedRooms} />
        <BuildingDirectorySection buildings={buildings} />
        <CampusMapSection mapPoints={mapPoints} allMapView={allMapView} />
      </main>

      <LandingFooter />
    </div>
  );
}