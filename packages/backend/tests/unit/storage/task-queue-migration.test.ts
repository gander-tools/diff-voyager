/**
 * Tests for task queue table migration
 */

import { randomUUID } from 'node:crypto';
import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeDatabase, createDatabase } from '../../../src/storage/database.js';

describe('Task Queue Migration', () => {
  let testDir: string;
  let dbPath: string;
  let db: Database.Database;

  beforeEach(() => {
    testDir = join(tmpdir(), `diff-voyager-test-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });
    dbPath = join(testDir, 'test.db');
    db = createDatabase({ dbPath, artifactsDir: join(testDir, 'artifacts') });
  });

  afterEach(() => {
    closeDatabase(db);
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('tasks table', () => {
    it('should create tasks table', () => {
      const tableExists = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tasks'")
        .get();

      expect(tableExists).toBeDefined();
    });

    it('should have correct columns', () => {
      const columns = db.prepare('PRAGMA table_info(tasks)').all() as Array<{
        name: string;
        type: string;
        notnull: number;
        dflt_value: string | null;
      }>;

      const columnNames = columns.map((c) => c.name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('type');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('priority');
      expect(columnNames).toContain('payload_json');
      expect(columnNames).toContain('attempts');
      expect(columnNames).toContain('max_attempts');
      expect(columnNames).toContain('error_message');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('started_at');
      expect(columnNames).toContain('completed_at');
    });

    it('should have NOT NULL constraints on required columns', () => {
      const columns = db.prepare('PRAGMA table_info(tasks)').all() as Array<{
        name: string;
        type: string;
        notnull: number;
      }>;

      const idColumn = columns.find((c) => c.name === 'id');
      expect(idColumn?.notnull).toBe(1);

      const typeColumn = columns.find((c) => c.name === 'type');
      expect(typeColumn?.notnull).toBe(1);

      const statusColumn = columns.find((c) => c.name === 'status');
      expect(statusColumn?.notnull).toBe(1);
    });

    it('should have indexes for efficient querying', () => {
      const indexes = db
        .prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='tasks'")
        .all() as Array<{
        name: string;
      }>;

      const indexNames = indexes.map((i) => i.name);

      // Should have index on status for dequeue operations
      expect(indexNames.some((name) => name.includes('status'))).toBe(true);

      // Should have index on created_at for ordering
      expect(indexNames.some((name) => name.includes('created_at'))).toBe(true);
    });

    it('should allow inserting task records', () => {
      const taskId = randomUUID();
      const stmt = db.prepare(`
        INSERT INTO tasks (id, type, status, priority, payload_json, attempts, max_attempts)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        taskId,
        'capture-page',
        'pending',
        'normal',
        JSON.stringify({ url: 'https://example.com' }),
        0,
        3,
      );

      expect(result.changes).toBe(1);

      const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
      expect(task).toBeDefined();
    });
  });
});
