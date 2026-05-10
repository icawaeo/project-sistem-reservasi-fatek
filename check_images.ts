import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
  const rooms = await prisma.room.findMany();
  for (const r of rooms) {
    console.log(`Room: ${r.room_name}, Image: ${r.room_imageUrl}`);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
