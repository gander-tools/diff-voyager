/**
 * Test database helper
 * Creates isolated SQLite databases for testing
 */

import { randomUUID } from 'node:crypto';
import { existsSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';

export type TestDatabase = Database.Database;

export async function createTestDb(): Promise<TestDatabase> {
  const dbPath = join(tmpdir(), `diff-voyager-test-${randomUUID()}.db`);
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
