require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;

console.log('DATABASE_URL:', databaseUrl ? 'SET' : 'NOT SET');

if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL is not set in .env file');
  process.exit(1);
}

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    const pgPool = new Pool({
      connectionString: databaseUrl,
    });

    const result = await pgPool.query('SELECT NOW()');
    console.log('✅ Database connection successful!');
    console.log('Server time:', result.rows[0].now);

    // Test Prisma
    const adapter = new PrismaPg(pgPool);
    const prisma = new PrismaClient({ adapter });

    const userCount = await prisma.user.count();
    console.log('✅ Prisma connection successful!');
    console.log('Total users in database:', userCount);

    await pgPool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testConnection();
