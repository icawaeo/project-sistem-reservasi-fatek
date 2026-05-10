require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


async function main() {
  console.log('Memulai migrasi data user...');
  
  // Update menggunakan raw query untuk bypass type checking strict jika diperlukan,
  // atau bisa langsung update string enum
  const result = await prisma.$executeRaw`UPDATE "User" SET "userType" = 'USER'::"UserType" WHERE "userType" IN ('STUDENT', 'PUBLIC')`;
  
  console.log(`Berhasil mengubah ${result} baris data user menjadi tipe USER.`);
}

main()
  .catch((e) => {
    console.error('Error saat migrasi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
