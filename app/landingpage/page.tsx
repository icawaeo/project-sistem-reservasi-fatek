import Navbar from "@/app/components/layout/Navbar";
import BuildingDirectorySection from "@/app/components/user/landingpage/BuildingDirectorySection";
import CampusMapSection from "@/app/components/user/landingpage/CampusMapSection";
import LandingFooter from "@/app/components/user/landingpage/LandingFooter";
import OccupiedRoomsSection from "@/app/components/user/landingpage/OccupiedRoomsSection";

import LandingAvailabilitySearch from "../components/user/landingpage/LandingAvailabilitySearch.client";
import { allMapView, buildings, mapPoints, occupiedRooms } from "../components/user/data/landingpage-data";

export default function LandingPage() {
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