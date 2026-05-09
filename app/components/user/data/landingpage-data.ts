import type { LandingBuildingCard } from "@/app/components/user/landingpage/BuildingDirectorySection";
import type { OccupiedRoomCard } from "@/app/components/user/landingpage/OccupiedRoomsSection";

export const occupiedRooms = [
  {
    name: "Auditorium Dekanat",
    building: "Gedung Dekanat Fakultas Teknik",
    activity: "Seminar Fakultas Teknik",
    time: "06:00 - 22:00 WITA",
  },
  {
    name: "Creative Room",
    building: "Gedung Jurusan Teknik Elektro",
    activity: "Workshop Desain UI/UX",
    time: "09:30 - 21:00 WITA",
  },
  {
    name: "Lab Multimedia",
    building: "Gedung Laboratorium Fakultas Teknik",
    activity: "Praktikum Multimedia",
    time: "07:30 - 11:30 WITA",
  },
  {
    name: "JTE - 02",
    building: "Gedung Jurusan Teknik Elektro",
    activity: "Rapat Organisasi Mahasiswa",
    time: "10:00 - 14:00 WITA",
  },
] satisfies OccupiedRoomCard[];

export const buildings = [
  {
    name: "Gedung Dekanat Fakultas Teknik",
    image: "/images/building/dekanat.jpeg",
    roomsLabel: "1 RUANGAN",
  },
  {
    name: "Gedung Jurusan Teknik Sipil",
    image: "/images/building/sipil.jpeg",
    roomsLabel: "3 RUANGAN",
  },
  {
    name: "Gedung Jurusan Teknik Arsitektur",
    image: "/images/building/jte.jpeg",
    roomsLabel: "3 RUANGAN",
  },
  {
    name: "Gedung Jurusan Teknik Elektro",
    image: "/images/building/jte.jpeg",
    roomsLabel: "5 RUANGAN",
  },
  {
    name: "Gedung Jurusan Teknik Mesin",
    image: "/images/building/dekanat.jpeg",
    roomsLabel: "3 RUANGAN",
  },
  {
    name: "Gedung Laboratorium Fakultas Teknik",
    image: "/images/building/lab.jpeg",
    roomsLabel: "3 RUANGAN",
  },
] satisfies LandingBuildingCard[];

export type CampusMapPointData = {
  name: string;
  shortUrl: string;
  embedUrl: string;
};

export const mapPoints = [
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
] satisfies CampusMapPointData[];

export const allMapView = {
  name: "Lihat Semua",
  shortUrl:
    "https://www.google.com/maps/dir/?api=1&origin=1.4594425,124.8258652&destination=1.4583367,124.8255388&travelmode=walking&waypoints=1.4579273,124.8263909|1.4597494,124.8260556|1.4590842,124.8255351|1.4585082,124.8256701",
  embedUrl: "https://www.google.com/maps?q=Fakultas+Teknik+Universitas+Sam+Ratulangi&z=18&output=embed",
} satisfies CampusMapPointData;
