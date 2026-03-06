import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient
  pgPool?: Pool
}

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set')
}

const pgPool =
  globalForPrisma.pgPool ||
  new Pool({
    connectionString: databaseUrl,
  })

const adapter = new PrismaPg(pgPool)

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ["query"],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.pgPool = pgPool
  globalForPrisma.prisma = prisma;
}