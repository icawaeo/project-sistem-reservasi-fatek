import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const { PrismaClient } = require('@prisma/client') as {
  PrismaClient: new (...args: any[]) => any
}

type PrismaClientInstance = InstanceType<typeof PrismaClient>

const globalForPrisma = global as unknown as {
  prisma?: PrismaClientInstance
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

// This client must stay aligned with the generated Prisma schema output.
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.pgPool = pgPool
  globalForPrisma.prisma = prisma;
}
