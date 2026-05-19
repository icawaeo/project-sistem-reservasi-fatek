import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { USER_ROLES, type UserRoleValue } from "../lib/user-enums";
import { type LabDepartmentValue, type LabProgramValue } from "../lib/lab-enums";

const { PrismaClient } = require("@prisma/client");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const pgPool = new Pool({
  connectionString: databaseUrl,
});

const adapter = new PrismaPg(pgPool);
const prisma = new PrismaClient({ adapter });

type SeedUser = {
  name: string;
  email: string;
  identifier: string;
  rank?: string;
  position?: string;
  userType: "STAFF";
  role: UserRoleValue;
  departmentScope?: LabDepartmentValue;
  programScope?: LabProgramValue;
};

const dummyPassword = "Admin12345";

const userSeeds: SeedUser[] = [
  {
    name: "Superadmin Dummy",
    email: "superadmin@unsrat.ac.id",
    identifier: "19870001",
    userType: "STAFF",
    role: USER_ROLES.SUPERADMIN,
  },
  {
    name: "Admin Dummy",
    email: "admin@unsrat.ac.id",
    identifier: "19870002",
    userType: "STAFF",
    role: USER_ROLES.ADMIN,
  },
  {
    name: "Admin Dekan Dummy",
    email: "dekan@unsrat.ac.id",
    identifier: "19870003",
    rank: "Pembina",
    position: "Dekan",
    userType: "STAFF",
    role: USER_ROLES.ADMIN_DEKAN,
  },
  {
    name: "Admin Wakil Dekan 2 Dummy",
    email: "wd2@unsrat.ac.id",
    identifier: "19870004",
    rank: "Pembina",
    position: "Wakil Dekan II",
    userType: "STAFF",
    role: USER_ROLES.ADMIN_WD2,
  },

  // Kajur (4 jurusan)
  {
    name: "Kajur Elektro Dummy",
    email: "kajur-elektro@unsrat.ac.id",
    identifier: "19871001",
    rank: "Penata",
    position: "Ketua Jurusan Teknik Elektro",
    userType: "STAFF",
    role: USER_ROLES.KAJUR,
    departmentScope: "ELEKTRO",
  },
  {
    name: "Kajur Arsitektur Dummy",
    email: "kajur-arsitektur@unsrat.ac.id",
    identifier: "19871002",
    rank: "Penata",
    position: "Ketua Jurusan Teknik Arsitektur",
    userType: "STAFF",
    role: USER_ROLES.KAJUR,
    departmentScope: "ARSITEKTUR",
  },
  {
    name: "Kajur Sipil Dummy",
    email: "kajur-sipil@unsrat.ac.id",
    identifier: "19871003",
    rank: "Penata",
    position: "Ketua Jurusan Teknik Sipil",
    userType: "STAFF",
    role: USER_ROLES.KAJUR,
    departmentScope: "SIPIL",
  },
  {
    name: "Kajur Mesin Dummy",
    email: "kajur-mesin@unsrat.ac.id",
    identifier: "19871004",
    rank: "Penata",
    position: "Ketua Jurusan Teknik Mesin",
    userType: "STAFF",
    role: USER_ROLES.KAJUR,
    departmentScope: "MESIN",
  },

  // Kepala Lab (7 prodi)
  {
    name: "Kepala Lab IT Dummy",
    email: "kalab-it@unsrat.ac.id",
    identifier: "19872001",
    rank: "Penata",
    position: "Kepala Lab Informatika",
    userType: "STAFF",
    role: USER_ROLES.KEPALA_LAB,
    programScope: "IT",
  },
  {
    name: "Kepala Lab Elektro Dummy",
    email: "kalab-elektro@unsrat.ac.id",
    identifier: "19872002",
    rank: "Penata",
    position: "Kepala Lab Elektro",
    userType: "STAFF",
    role: USER_ROLES.KEPALA_LAB,
    programScope: "ELEKTRO",
  },
  {
    name: "Kepala Lab Arsitektur Dummy",
    email: "kalab-arsitektur@unsrat.ac.id",
    identifier: "19872003",
    rank: "Penata",
    position: "Kepala Lab Arsitektur",
    userType: "STAFF",
    role: USER_ROLES.KEPALA_LAB,
    programScope: "ARSITEKTUR",
  },
  {
    name: "Kepala Lab PWK Dummy",
    email: "kalab-pwk@unsrat.ac.id",
    identifier: "19872004",
    rank: "Penata",
    position: "Kepala Lab PWK",
    userType: "STAFF",
    role: USER_ROLES.KEPALA_LAB,
    programScope: "PWK",
  },
  {
    name: "Kepala Lab Sipil Dummy",
    email: "kalab-sipil@unsrat.ac.id",
    identifier: "19872005",
    rank: "Penata",
    position: "Kepala Lab Sipil",
    userType: "STAFF",
    role: USER_ROLES.KEPALA_LAB,
    programScope: "SIPIL",
  },
  {
    name: "Kepala Lab Lingkungan Dummy",
    email: "kalab-lingkungan@unsrat.ac.id",
    identifier: "19872006",
    rank: "Penata",
    position: "Kepala Lab Lingkungan",
    userType: "STAFF",
    role: USER_ROLES.KEPALA_LAB,
    programScope: "LINGKUNGAN",
  },
  {
    name: "Kepala Lab Mesin Dummy",
    email: "kalab-mesin@unsrat.ac.id",
    identifier: "19872007",
    rank: "Penata",
    position: "Kepala Lab Mesin",
    userType: "STAFF",
    role: USER_ROLES.KEPALA_LAB,
    programScope: "MESIN",
  },
];

const LAB_BUILDING_NAME = "Gedung Laboratorium Fakultas Teknik";

const buildingDefaultImageMap: Record<string, string> = {
  "Gedung Dekanat Fakultas Teknik": "/images/dekanat.jpeg",
  "Gedung Jurusan Teknik Sipil": "/images/sipil.jpeg",
  "Gedung Jurusan Teknik Arsitektur": "/images/jte.jpeg",
  "Gedung Jurusan Teknik Elektro": "/images/jte.jpeg",
  "Gedung Jurusan Teknik Mesin": "/images/dekanat.jpeg",
  "Gedung Laboratorium Fakultas Teknik": "/images/lab.jpeg",
};

function getBuildingDefaultImage(buildingName: string): string | null {
  if (!buildingName) return null;
  return buildingDefaultImageMap[buildingName] ?? null;
}

const programToDepartment = (program: LabProgramValue): LabDepartmentValue => {
  if (program === "IT" || program === "ELEKTRO") return "ELEKTRO";
  if (program === "ARSITEKTUR" || program === "PWK") return "ARSITEKTUR";
  if (program === "SIPIL" || program === "LINGKUNGAN") return "SIPIL";
  return "MESIN";
};

const resolveLabProgramFromRoomName = (roomName: string): LabProgramValue => {
  const normalized = roomName.toLowerCase();

  if (normalized.includes("perangkat lunak") || normalized.includes("keamanan") || normalized.includes("multimedia")) {
    return "IT";
  }

  return "IT";
};

type SeedRoom = {
  room_name: string;
  room_building: string;
  room_locDetail: string;
  room_capacity: number;
  room_imageUrl: string;
  room_isActive?: boolean;
};

type SeedBuilding = {
  building_name: string;
  operational_days: string[];
  open_time: string;
  close_time: string;
};

const buildingSeeds: SeedBuilding[] = [
  {
    building_name: "Gedung Dekanat Fakultas Teknik",
    operational_days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
    open_time: "08:00",
    close_time: "16:00",
  },
  {
    building_name: "Gedung Jurusan Teknik Sipil",
    operational_days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
    open_time: "08:00",
    close_time: "16:00",
  },
  {
    building_name: "Gedung Jurusan Teknik Arsitektur",
    operational_days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
    open_time: "08:00",
    close_time: "17:00",
  },
  {
    building_name: "Gedung Jurusan Teknik Elektro",
    operational_days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
    open_time: "08:00",
    close_time: "16:00",
  },
  {
    building_name: "Gedung Jurusan Teknik Mesin",
    operational_days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
    open_time: "08:00",
    close_time: "16:00",
  },
  {
    building_name: "Gedung Laboratorium Fakultas Teknik",
    operational_days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
    open_time: "08:00",
    close_time: "18:00",
  },
];

const roomSeeds: SeedRoom[] = [
  {
    room_name: "Auditorium Dekanat",
    room_building: "Gedung Dekanat Fakultas Teknik",
    room_locDetail: "Lantai 1",
    room_capacity: 180,
    room_imageUrl: getBuildingDefaultImage("Gedung Dekanat Fakultas Teknik")!,
  },
  {
    room_name: "Studio Perancangan Sipil",
    room_building: "Gedung Jurusan Teknik Sipil",
    room_locDetail: "Lantai 1",
    room_capacity: 35,
    room_imageUrl: getBuildingDefaultImage("Gedung Jurusan Teknik Sipil")!,
  },
  {
    room_name: "Ruang Kuliah Sipil A",
    room_building: "Gedung Jurusan Teknik Sipil",
    room_locDetail: "Lantai 2",
    room_capacity: 45,
    room_imageUrl: getBuildingDefaultImage("Gedung Jurusan Teknik Sipil")!,
  },
  {
    room_name: "Ruang Kuliah Sipil B",
    room_building: "Gedung Jurusan Teknik Sipil",
    room_locDetail: "Lantai 3",
    room_capacity: 25,
    room_imageUrl: getBuildingDefaultImage("Gedung Jurusan Teknik Sipil")!,
  },
  {
    room_name: "Studio Arsitektur 1",
    room_building: "Gedung Jurusan Teknik Arsitektur",
    room_locDetail: "Lantai 1",
    room_capacity: 50,
    room_imageUrl: getBuildingDefaultImage("Gedung Jurusan Teknik Arsitektur")!,
  },
  {
    room_name: "Studio Arsitektur 2",
    room_building: "Gedung Jurusan Teknik Arsitektur",
    room_locDetail: "Lantai 2",
    room_capacity: 40,
    room_imageUrl: getBuildingDefaultImage("Gedung Jurusan Teknik Arsitektur")!,
  },
  {
    room_name: "Ruang Presentasi Arsitektur",
    room_building: "Gedung Jurusan Teknik Arsitektur",
    room_locDetail: "Lantai 2",
    room_capacity: 30,
    room_imageUrl: getBuildingDefaultImage("Gedung Jurusan Teknik Arsitektur")!,
  },
  {
    room_name: "JTE - 01",
    room_building: "Gedung Jurusan Teknik Elektro",
    room_locDetail: "Lantai 1",
    room_capacity: 40,
    room_imageUrl: getBuildingDefaultImage("Gedung Jurusan Teknik Elektro")!,
  },
  {
    room_name: "JTE - 02",
    room_building: "Gedung Jurusan Teknik Elektro",
    room_locDetail: "Lantai 1",
    room_capacity: 40,
    room_imageUrl: getBuildingDefaultImage("Gedung Jurusan Teknik Elektro")!,
  },
  {
    room_name: "Creative Room",
    room_building: "Gedung Jurusan Teknik Elektro",
    room_locDetail: "Lantai 2",
    room_capacity: 20,
    room_imageUrl: getBuildingDefaultImage("Gedung Jurusan Teknik Elektro")!,
  },
  {
    room_name: "Ruang Seminar 01",
    room_building: "Gedung Jurusan Teknik Elektro",
    room_locDetail: "Lantai 1",
    room_capacity: 32,
    room_imageUrl: getBuildingDefaultImage("Gedung Jurusan Teknik Elektro")!,
  },
  {
    room_name: "Ruang Seminar 02",
    room_building: "Gedung Jurusan Teknik Elektro",
    room_locDetail: "Lantai 1",
    room_capacity: 32,
    room_imageUrl: getBuildingDefaultImage("Gedung Jurusan Teknik Elektro")!,
  },
  {
    room_name: "Ruang Kuliah Mesin A",
    room_building: "Gedung Jurusan Teknik Mesin",
    room_locDetail: "Lantai 2",
    room_capacity: 45,
    room_imageUrl: getBuildingDefaultImage("Gedung Jurusan Teknik Mesin")!,
  },
  {
    room_name: "Bengkel Mesin Produksi",
    room_building: "Gedung Jurusan Teknik Mesin",
    room_locDetail: "Lantai 1",
    room_capacity: 28,
    room_imageUrl: getBuildingDefaultImage("Gedung Jurusan Teknik Mesin")!,
  },
  {
    room_name: "Ruang Seminar Mesin",
    room_building: "Gedung Jurusan Teknik Mesin",
    room_locDetail: "Lantai 2",
    room_capacity: 35,
    room_imageUrl: getBuildingDefaultImage("Gedung Jurusan Teknik Mesin")!,
  },
  {
    room_name: "Lab Multimedia",
    room_building: "Gedung Laboratorium Fakultas Teknik",
    room_locDetail: "Lantai 3",
    room_capacity: 24,
    room_imageUrl: getBuildingDefaultImage("Gedung Laboratorium Fakultas Teknik")!,
  },
  {
    room_name: "Lab Rekayasa Perangkat Lunak",
    room_building: "Gedung Laboratorium Fakultas Teknik",
    room_locDetail: "Lantai 3",
    room_capacity: 30,
    room_imageUrl: getBuildingDefaultImage("Gedung Laboratorium Fakultas Teknik")!,
  },
  {
    room_name: "Lab Keamanan Siber",
    room_building: "Gedung Laboratorium Fakultas Teknik",
    room_locDetail: "Lantai 3",
    room_capacity: 18,
    room_imageUrl: getBuildingDefaultImage("Gedung Laboratorium Fakultas Teknik")!,
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
      const isLabBuilding = room.room_building === LAB_BUILDING_NAME;
      const labProgram = isLabBuilding ? resolveLabProgramFromRoomName(room.room_name) : undefined;
      const labDepartment = labProgram ? programToDepartment(labProgram) : undefined;

      await prisma.room.update({
        where: { room_id: existingRoom.room_id },
        data: {
          room_locDetail: room.room_locDetail,
          room_capacity: room.room_capacity,
          room_imageUrl: room.room_imageUrl,
          room_isActive: room.room_isActive ?? true,
          labProgram,
          labDepartment,
        },
      });
      updatedCount += 1;
      continue;
    }

    const isLabBuilding = room.room_building === LAB_BUILDING_NAME;
    const labProgram = isLabBuilding ? resolveLabProgramFromRoomName(room.room_name) : undefined;
    const labDepartment = labProgram ? programToDepartment(labProgram) : undefined;

    await prisma.room.create({
      data: {
        ...room,
        room_isActive: room.room_isActive ?? true,
        labProgram,
        labDepartment,
        building: {
          connect: { building_name: room.room_building },
        },
      },
    });
    createdCount += 1;
  }

  console.log(`Room seed complete. Created: ${createdCount}, Updated: ${updatedCount}`);
}

async function seedBuildings() {
  let createdCount = 0;
  let updatedCount = 0;

  for (const building of buildingSeeds) {
    const existingBuilding = await prisma.building.findUnique({
      where: {
        building_name: building.building_name,
      },
      select: { building_id: true },
    });

    if (existingBuilding) {
      await prisma.building.update({
        where: { building_id: existingBuilding.building_id },
        data: {
          operational_days: building.operational_days,
          open_time: building.open_time,
          close_time: building.close_time,
        },
      });
      updatedCount += 1;
      continue;
    }

    await prisma.building.create({
      data: building,
    });
    createdCount += 1;
  }

  console.log(`Building seed complete. Created: ${createdCount}, Updated: ${updatedCount}`);
}

async function seedUsers() {
  const passwordHash = await bcrypt.hash(dummyPassword, 10);

  for (const user of userSeeds) {
    await prisma.user.upsert({
      where: { email: user.email.toLowerCase() },
      update: {
        name: user.name,
        identifier: user.identifier,
        rank: user.rank ?? null,
        position: user.position ?? null,
        userType: user.userType,
        role: user.role,
        departmentScope: user.departmentScope ?? null,
        programScope: user.programScope ?? null,
        passwordHash,
      },
      create: {
        name: user.name,
        email: user.email.toLowerCase(),
        identifier: user.identifier,
        rank: user.rank ?? null,
        position: user.position ?? null,
        userType: user.userType,
        role: user.role,
        departmentScope: user.departmentScope ?? null,
        programScope: user.programScope ?? null,
        passwordHash,
      },
    });
  }

  console.log("Dummy users are ready:");
  console.log("- superadmin@unsrat.ac.id / Admin12345");
  console.log("- admin@unsrat.ac.id / Admin12345");
  console.log("- dekan@unsrat.ac.id / Admin12345");
  console.log("- wd2@unsrat.ac.id / Admin12345");
  console.log("- kajur-elektro@unsrat.ac.id / Admin12345");
  console.log("- kajur-arsitektur@unsrat.ac.id / Admin12345");
  console.log("- kajur-sipil@unsrat.ac.id / Admin12345");
  console.log("- kajur-mesin@unsrat.ac.id / Admin12345");
  console.log("- kalab-it@unsrat.ac.id / Admin12345");
  console.log("- kalab-elektro@unsrat.ac.id / Admin12345");
  console.log("- kalab-arsitektur@unsrat.ac.id / Admin12345");
  console.log("- kalab-pwk@unsrat.ac.id / Admin12345");
  console.log("- kalab-sipil@unsrat.ac.id / Admin12345");
  console.log("- kalab-lingkungan@unsrat.ac.id / Admin12345");
  console.log("- kalab-mesin@unsrat.ac.id / Admin12345");
}

async function main() {
  console.log("Seeding building and room data for admin pages...");
  await seedUsers();
  await seedBuildings();
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
