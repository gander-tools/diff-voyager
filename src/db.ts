import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type Database from 'better-sqlite3';
import BetterSqlite3 from 'better-sqlite3';
import { type BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate as drizzleMigrate } from 'drizzle-orm/better-sqlite3/migrator';
import { pageSlug } from './slug';

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
  backfillUrlPageSlug(db);
}

// migration.sql adds host/query_string/page_slug w/ DEFAULT '' (SQLite ALTER TABLE ADD COLUMN
// NOT NULL requires a constant default on a non-empty table); recompute real values here for
// any pre-existing row left with the placeholder, using the same derivation as urlsRepo.insert.
function backfillUrlPageSlug(db: Database.Database): void {
  const rows = db.prepare("SELECT id, url FROM urls WHERE page_slug = ''").all() as {
    id: string;
    url: string;
  }[];

  if (rows.length === 0) {
    return;
  }

  const update = db.prepare(
    'UPDATE urls SET host = ?, query_string = ?, page_slug = ? WHERE id = ?',
  );
  for (const row of rows) {
    const parsed = new URL(row.url);
    const queryString = parsed.search.replace(/^\?/, '');
    update.run(parsed.host, queryString, pageSlug(parsed.pathname, queryString), row.id);
  }
}

export function toDrizzle(db: Database.Database): BetterSQLite3Database {
  return drizzle({ client: db });
}
