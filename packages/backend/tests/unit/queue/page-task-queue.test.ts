/**
 * Tests for PageTaskQueue
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync, rmSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createDatabase, closeDatabase } from '../../../src/storage/database.js';
import { PageTaskQueue } from '../../../src/queue/page-task-queue.js';
import type { CapturePagePayload } from '../../../src/queue/types.js';

describe('PageTaskQueue.enqueueBatch()', () => {
  let testDir: string;
  let dbPath: string;
  let db: Database.Database;
  let pageQueue: PageTaskQueue;

  beforeEach(() => {
    testDir = join(tmpdir(), `diff-voyager-test-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });
    dbPath = join(testDir, 'test.db');
    db = createDatabase({ dbPath, artifactsDir: join(testDir, 'artifacts') });
    pageQueue = new PageTaskQueue(db);
  });

  afterEach(() => {
    closeDatabase(db);
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should enqueue multiple page tasks', () => {
    const pages: CapturePagePayload[] = [
      {
        runId: 'run-123',
        pageId: 'page-1',
        url: 'https://example.com/page1',
        projectId: 'project-789',
        isBaseline: true,
        config: {},
      },
      {
        runId: 'run-123',
        pageId: 'page-2',
        url: 'https://example.com/page2',
        projectId: 'project-789',
        isBaseline: true,
        config: {},
      },
      {
        runId: 'run-123',
        pageId: 'page-3',
        url: 'https://example.com/page3',
        projectId: 'project-789',
        isBaseline: true,
        config: {},
      },
    ];

    const taskIds = pageQueue.enqueueBatch(pages);

    expect(taskIds).toHaveLength(3);
    expect(taskIds.every((id) => typeof id === 'string')).toBe(true);

    const count = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number };
    expect(count.count).toBe(3);
  });

  it('should return empty array for empty input', () => {
    const taskIds = pageQueue.enqueueBatch([]);
    expect(taskIds).toHaveLength(0);
  });

  it('should apply priority to all tasks', () => {
    const pages: CapturePagePayload[] = [
      {
        runId: 'run-123',
        pageId: 'page-1',
        url: 'https://example.com/page1',
        projectId: 'project-789',
        isBaseline: true,
        config: {},
      },
      {
        runId: 'run-123',
        pageId: 'page-2',
        url: 'https://example.com/page2',
        projectId: 'project-789',
        isBaseline: true,
        config: {},
      },
    ];

    pageQueue.enqueueBatch(pages, 'high');

    const tasks = db.prepare('SELECT priority FROM tasks').all() as Array<{ priority: string }>;
    expect(tasks.every((t) => t.priority === 'high')).toBe(true);
  });

  it('should apply maxAttempts to all tasks', () => {
    const pages: CapturePagePayload[] = [
      {
        runId: 'run-123',
        pageId: 'page-1',
        url: 'https://example.com/page1',
        projectId: 'project-789',
        isBaseline: true,
        config: {},
      },
      {
        runId: 'run-123',
        pageId: 'page-2',
        url: 'https://example.com/page2',
        projectId: 'project-789',
        isBaseline: true,
        config: {},
      },
    ];

    pageQueue.enqueueBatch(pages, 'normal', 5);

    const tasks = db.prepare('SELECT max_attempts FROM tasks').all() as Array<{
      max_attempts: number;
    }>;
    expect(tasks.every((t) => t.max_attempts === 5)).toBe(true);
  });
});
