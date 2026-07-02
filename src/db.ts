import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type Database from 'better-sqlite3';
import BetterSqlite3 from 'better-sqlite3';
import { type BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate as drizzleMigrate } from 'drizzle-orm/better-sqlite3/migrator';
import { DrizzleUrlsRepo } from './repos/urlsRepo';

const migrationsFolder = fileURLToPath(new URL('../migrations', import.meta.url));

export function openDb(dbPath: string): Database.Database {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new BetterSqlite3(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = ON');

  return db;
}

export function migrate(db: Database.Database): void {
  drizzleMigrate(drizzle({ client: db }), { migrationsFolder });
  new DrizzleUrlsRepo(toDrizzle(db)).backfillLegacyPageSlugs();
}

export function toDrizzle(db: Database.Database): BetterSQLite3Database {
  return drizzle({ client: db });
}
