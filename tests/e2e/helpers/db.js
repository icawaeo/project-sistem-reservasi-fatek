require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

const E2E_PREFIX = "E2E Selenium";
const PASSWORD = "Admin12345";

async function cleanupE2EData() {
  const e2eUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { startsWith: "e2e-" } },
        { name: { startsWith: E2E_PREFIX } },
      ],
    },
    select: { user_id: true },
  });

  const e2eRooms = await prisma.room.findMany({
    where: { room_name: { startsWith: E2E_PREFIX } },
    select: { room_id: true },
  });

  await prisma.reservationItem.deleteMany({
    where: {
      reservation: {
        OR: [
          { res_purpose: { startsWith: E2E_PREFIX } },
          { user_id: { in: e2eUsers.map((user) => user.user_id) } },
          { room_id: { in: e2eRooms.map((room) => room.room_id) } },
        ],
      },
    },
  });

  await prisma.reservation.deleteMany({
    where: {
      OR: [
        { res_purpose: { startsWith: E2E_PREFIX } },
        { user_id: { in: e2eUsers.map((user) => user.user_id) } },
        { room_id: { in: e2eRooms.map((room) => room.room_id) } },
      ],
    },
  });

  await prisma.pendingRegistration.deleteMany({
    where: { email: { startsWith: "e2e-" } },
  });

  await prisma.notification.deleteMany({
    where: { userId: { in: e2eUsers.map((user) => user.user_id) } },
  });

  await prisma.fcmToken.deleteMany({
    where: { userId: { in: e2eUsers.map((user) => user.user_id) } },
  });

  await prisma.room.deleteMany({
    where: { room_name: { startsWith: E2E_PREFIX } },
  });

  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { startsWith: "e2e-" } },
        { name: { startsWith: E2E_PREFIX } },
      ],
    },
  });
}

async function createUser({
  email,
  name,
  identifier,
  userType = "USER",
  role = "USER",
  departmentScope = null,
  programScope = null,
}) {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  return prisma.user.upsert({
    where: { email },
    update: {
      name,
      identifier,
      userType,
      role,
      departmentScope,
      programScope,
      passwordHash,
    },
    create: {
      email,
      name,
      identifier,
      userType,
      role,
      departmentScope,
      programScope,
      passwordHash,
    },
  });
}

async function getDefaultBuilding() {
  return prisma.building.findFirstOrThrow({
    where: {
      building_isActive: true,
      building_name: "Gedung Dekanat Fakultas Teknik",
    },
  });
}

async function createRoom({
  name,
  buildingName = "Gedung Dekanat Fakultas Teknik",
  capacity = 20,
  locDetail = "1, Proyektor",
}) {
  const building = await prisma.building.findUniqueOrThrow({
    where: { building_name: buildingName },
  });

  return prisma.room.create({
    data: {
      room_name: name,
      room_building: building.building_name,
      building_id: building.building_id,
      room_locDetail: locDetail,
      room_capacity: capacity,
      room_imageUrl: null,
      room_isActive: true,
    },
  });
}

async function createReservation({
  userId,
  roomId,
  purpose,
  start,
  end,
  status = "PENDING",
  flow = "GENERAL",
}) {
  return prisma.reservation.create({
    data: {
      user_id: userId,
      room_id: roomId,
      res_purpose: purpose,
      res_startTime: start,
      res_endTime: end,
      res_status: status,
      res_flow: flow,
      res_documentUrl: "/uploads/e2e-document.pdf",
    },
  });
}

async function disconnectDb() {
  await prisma.$disconnect();
  await pool.end();
}

module.exports = {
  E2E_PREFIX,
  PASSWORD,
  prisma,
  cleanupE2EData,
  createUser,
  getDefaultBuilding,
  createRoom,
  createReservation,
  disconnectDb,
};
