import { PrismaClient } from '@prisma/client'

/**
 * AdForge — Lazy, Safe Database Wrapper
 *
 * Uses a Proxy so PrismaClient is only created on first property access.
 * If the database is unavailable (e.g. Netlify serverless — no persistent
 * filesystem), every property returns undefined and isDbAvailable() returns false.
 *
 * This prevents the import itself from crashing on serverless platforms.
 */

let _db: PrismaClient | null = null
let _dbInitAttempted = false
let _dbAvailable = false

function tryInitDb(): PrismaClient | null {
  if (_db) return _db
  if (_dbInitAttempted) return null
  _dbInitAttempted = true

  try {
    const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }
    _db = globalForPrisma.prisma ?? new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = _db
    _dbAvailable = true
    return _db
  } catch (err) {
    console.warn('Database unavailable (serverless mode):', err instanceof Error ? err.message : String(err))
    return null
  }
}

/** Lazy-initialized Prisma client. Returns null-backed proxy if DB is unavailable. */
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const instance = tryInitDb()
    if (!instance) return undefined
    return (instance as any)[prop]
  },
})

/** Check if database is available. Call this before DB-dependent operations. */
export function isDbAvailable(): boolean {
  tryInitDb()
  return _dbAvailable
}
