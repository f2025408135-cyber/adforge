import { PrismaClient } from '@prisma/client'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Ensure we use the correct absolute path for SQLite in all environments
const dbPath = path.join(process.cwd(), 'db', 'custom.db')
const datasourceUrl = `file:${dbPath}`

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasourceUrl,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
