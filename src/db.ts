import { fileURLToPath } from 'node:url';
import type Database from 'better-sqlite3';
import BetterSqlite3 from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate as drizzleMigrate } from 'drizzle-orm/better-sqlite3/migrator';

const migrationsFolder = fileURLToPath(new URL('../migrations', import.meta.url));

export function openDb(path: string): Database.Database {
  const db = new BetterSqlite3(path);

  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = ON');

  return db;
}

export function migrate(db: Database.Database): void {
  drizzleMigrate(drizzle({ client: db }), { migrationsFolder });
}
