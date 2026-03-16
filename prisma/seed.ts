import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const pgPool = new Pool({
  connectionString: databaseUrl,
});

const adapter = new PrismaPg(pgPool);
const prisma = new PrismaClient({ adapter });

type SeedRoom = {
  room_name: string;
  room_building: string;
  room_locDetail: string;
  room_capacity: number;
  room_imageUrl: string;
  room_isActive?: boolean;
};

const buildingImageMap: Record<string, string> = {
  "Gedung Dekanat Fakultas Teknik": "/images/building/dekanat.jpeg",
  "Gedung Jurusan Teknik Sipil": "/images/building/sipil.jpeg",
  "Gedung Jurusan Teknik Arsitektur": "/images/building/jte.jpeg",
  "Gedung Jurusan Teknik Elektro": "/images/building/jte.jpeg",
  "Gedung Jurusan Teknik Mesin": "/images/building/dekanat.jpeg",
  "Gedung Laboratorium Fakultas Teknik": "/images/building/lab.jpeg",
};

const roomSeeds: SeedRoom[] = [
  {
    room_name: "Auditorium Dekanat",
    room_building: "Gedung Dekanat Fakultas Teknik",
    room_locDetail: "Lantai 1",
    room_capacity: 180,
    room_imageUrl: buildingImageMap["Gedung Dekanat Fakultas Teknik"],
  },
  {
    room_name: "Studio Perancangan Sipil",
    room_building: "Gedung Jurusan Teknik Sipil",
    room_locDetail: "Lantai 1",
    room_capacity: 35,
    room_imageUrl: buildingImageMap["Gedung Jurusan Teknik Sipil"],
  },
  {
    room_name: "Ruang Kuliah Sipil A",
    room_building: "Gedung Jurusan Teknik Sipil",
    room_locDetail: "Lantai 2",
    room_capacity: 45,
    room_imageUrl: buildingImageMap["Gedung Jurusan Teknik Sipil"],
  },
  {
    room_name: "Ruang Kuliah Sipil B",
    room_building: "Gedung Jurusan Teknik Sipil",
    room_locDetail: "Lantai 3",
    room_capacity: 25,
    room_imageUrl: buildingImageMap["Gedung Jurusan Teknik Sipil"],
  },
  {
    room_name: "Studio Arsitektur 1",
    room_building: "Gedung Jurusan Teknik Arsitektur",
    room_locDetail: "Lantai 1",
    room_capacity: 50,
    room_imageUrl: buildingImageMap["Gedung Jurusan Teknik Arsitektur"],
  },
  {
    room_name: "Studio Arsitektur 2",
    room_building: "Gedung Jurusan Teknik Arsitektur",
    room_locDetail: "Lantai 2",
    room_capacity: 40,
    room_imageUrl: buildingImageMap["Gedung Jurusan Teknik Arsitektur"],
  },
  {
    room_name: "Ruang Presentasi Arsitektur",
    room_building: "Gedung Jurusan Teknik Arsitektur",
    room_locDetail: "Lantai 2",
    room_capacity: 30,
    room_imageUrl: buildingImageMap["Gedung Jurusan Teknik Arsitektur"],
  },
  {
    room_name: "JTE - 01",
    room_building: "Gedung Jurusan Teknik Elektro",
    room_locDetail: "Lantai 1",
    room_capacity: 40,
    room_imageUrl: buildingImageMap["Gedung Jurusan Teknik Elektro"],
  },
  {
    room_name: "JTE - 02",
    room_building: "Gedung Jurusan Teknik Elektro",
    room_locDetail: "Lantai 1",
    room_capacity: 40,
    room_imageUrl: buildingImageMap["Gedung Jurusan Teknik Elektro"],
  },
  {
    room_name: "Creative Room",
    room_building: "Gedung Jurusan Teknik Elektro",
    room_locDetail: "Lantai 2",
    room_capacity: 20,
    room_imageUrl: buildingImageMap["Gedung Jurusan Teknik Elektro"],
  },
  {
    room_name: "Ruang Seminar 01",
    room_building: "Gedung Jurusan Teknik Elektro",
    room_locDetail: "Lantai 1",
    room_capacity: 32,
    room_imageUrl: buildingImageMap["Gedung Jurusan Teknik Elektro"],
  },
  {
    room_name: "Ruang Seminar 02",
    room_building: "Gedung Jurusan Teknik Elektro",
    room_locDetail: "Lantai 1",
    room_capacity: 32,
    room_imageUrl: buildingImageMap["Gedung Jurusan Teknik Elektro"],
  },
  {
    room_name: "Ruang Kuliah Mesin A",
    room_building: "Gedung Jurusan Teknik Mesin",
    room_locDetail: "Lantai 2",
    room_capacity: 45,
    room_imageUrl: buildingImageMap["Gedung Jurusan Teknik Mesin"],
  },
  {
    room_name: "Bengkel Mesin Produksi",
    room_building: "Gedung Jurusan Teknik Mesin",
    room_locDetail: "Lantai 1",
    room_capacity: 28,
    room_imageUrl: buildingImageMap["Gedung Jurusan Teknik Mesin"],
  },
  {
    room_name: "Ruang Seminar Mesin",
    room_building: "Gedung Jurusan Teknik Mesin",
    room_locDetail: "Lantai 2",
    room_capacity: 35,
    room_imageUrl: buildingImageMap["Gedung Jurusan Teknik Mesin"],
  },
  {
    room_name: "Lab Multimedia",
    room_building: "Gedung Laboratorium Fakultas Teknik",
    room_locDetail: "Lantai 3",
    room_capacity: 24,
    room_imageUrl: buildingImageMap["Gedung Laboratorium Fakultas Teknik"],
  },
  {
    room_name: "Lab Rekayasa Perangkat Lunak",
    room_building: "Gedung Laboratorium Fakultas Teknik",
    room_locDetail: "Lantai 3",
    room_capacity: 30,
    room_imageUrl: buildingImageMap["Gedung Laboratorium Fakultas Teknik"],
  },
  {
    room_name: "Lab Keamanan Siber",
    room_building: "Gedung Laboratorium Fakultas Teknik",
    room_locDetail: "Lantai 3",
    room_capacity: 18,
    room_imageUrl: buildingImageMap["Gedung Laboratorium Fakultas Teknik"],
  },
];

async function seedRooms() {
  let createdCount = 0;
  let updatedCount = 0;

  for (const room of roomSeeds) {
    const existingRoom = await prisma.room.findFirst({
      where: {
        room_name: room.room_name,
        room_building: room.room_building,
      },
      select: { room_id: true },
    });

    if (existingRoom) {
      await prisma.room.update({
        where: { room_id: existingRoom.room_id },
        data: {
          room_locDetail: room.room_locDetail,
          room_capacity: room.room_capacity,
          room_imageUrl: room.room_imageUrl,
          room_isActive: room.room_isActive ?? true,
        },
      });
      updatedCount += 1;
      continue;
    }

    await prisma.room.create({
      data: {
        ...room,
        room_isActive: room.room_isActive ?? true,
      },
    });
    createdCount += 1;
  }

  console.log(`Room seed complete. Created: ${createdCount}, Updated: ${updatedCount}`);
}

async function main() {
  console.log("Seeding room data for landing page and building pages...");
  await seedRooms();
}

main()
  .catch((error) => {
    console.error("Failed to seed room data.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pgPool.end();
  });