import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { app } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import Database from 'better-sqlite3'
import * as schema from './schema'

let db: ReturnType<typeof drizzle> | null = null
let sqlite: Database.Database | null = null

export function initDatabase(): void {
  const dbPath = join(app.getPath('userData'), 'infinito.db')
  sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  db = drizzle(sqlite, { schema })

  const migrationsFolder = is.dev
    ? join(process.cwd(), 'src/database/migrations')
    : join(process.resourcesPath, 'migrations')

  migrate(db, { migrationsFolder })
}

export function getDb(): ReturnType<typeof drizzle> {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export function closeDatabase(): void {
  if (sqlite) {
    sqlite.close()
    sqlite = null
    db = null
  }
}
