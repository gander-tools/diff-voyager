/**
 * Test database helper
 * Creates isolated SQLite databases for testing
 */

import { randomUUID } from 'node:crypto';
import { existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import * as tmp from 'tmp';
import { createDrizzleDb, type DrizzleDb } from '../../src/storage/drizzle/db.js';

export type TestDatabase = Database.Database;

export async function createTestDb(): Promise<TestDatabase> {
  const tmpDir = tmp.dirSync({ unsafeCleanup: true, prefix: 'diff-voyager-test-' }).name;
  const dbPath = join(tmpDir, `${randomUUID()}.db`);
  const db = new Database(dbPath);

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');

  return db;
}

export async function cleanupTestDb(db: TestDatabase): Promise<void> {
  const dbPath = db.name;
  db.close();

  if (existsSync(dbPath)) {
    unlinkSync(dbPath);
  }
  // Clean up WAL files if they exist
  if (existsSync(`${dbPath}-wal`)) {
    unlinkSync(`${dbPath}-wal`);
  }
  if (existsSync(`${dbPath}-shm`)) {
    unlinkSync(`${dbPath}-shm`);
  }
}

/**
 * Create a Drizzle test database instance
 * Returns a type-safe Drizzle DB for testing
 */
export async function createDrizzleTestDb(): Promise<DrizzleDb> {
  const sqliteDb = await createTestDb();
  return createDrizzleDb(sqliteDb);
}
