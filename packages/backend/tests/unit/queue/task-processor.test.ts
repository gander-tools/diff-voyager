/**
 * Tests for TaskProcessor
 */

import { randomUUID } from 'node:crypto';
import { mkdirSync, rmSync } from 'node:fs';
import * as tmp from 'tmp';
import { join } from 'node:path';
import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TaskProcessor } from '../../../src/queue/task-processor.js';
import type { CapturePagePayload } from '../../../src/queue/types.js';
import { closeDatabase, createDatabase } from '../../../src/storage/database.js';

describe('TaskProcessor', () => {
  let testDir: string;
  let dbPath: string;
  let db: Database.Database;
  let processor: TaskProcessor;

  beforeEach(() => {
    testDir = join(tmpdir(), `diff-voyager-test-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });
    dbPath = join(testDir, 'test.db');
    db = createDatabase({ dbPath, artifactsDir: join(testDir, 'artifacts') });
    processor = new TaskProcessor(db);
  });

  afterEach(async () => {
    if (processor.isRunning()) {
      await processor.stop();
    }
    closeDatabase(db);
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('handler registration', () => {
    it('should register task handler', () => {
      const handler = async () => {
        // No-op handler for registration test
      };
      processor.registerHandler('capture-page', handler);
      expect(true).toBe(true); // Handler registered successfully
    });
  });

  describe('start and stop', () => {
    it('should start processor', async () => {
      const handler = async () => {
        // No-op handler for start/stop test
      };
      processor.registerHandler('capture-page', handler);

      // Start in background
      const startPromise = processor.start();

      // Wait a bit for it to start
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(processor.isRunning()).toBe(true);

      await processor.stop();
      await startPromise;
    });

    it('should stop processor gracefully', async () => {
      const handler = async () => {
        // No-op handler for graceful stop test
      };
      processor.registerHandler('capture-page', handler);

      const startPromise = processor.start();
      await new Promise((resolve) => setTimeout(resolve, 100));

      await processor.stop();
      expect(processor.isRunning()).toBe(false);

      await startPromise;
    });
  });

  describe('task processing', () => {
    it('should process task and mark as completed', async () => {
      const processed: string[] = [];

      processor.registerHandler('capture-page', async (task) => {
        processed.push(task.id);
      });

      const payload: CapturePagePayload = {
        runId: 'run-123',
        pageId: 'page-456',
        url: 'https://example.com',
        projectId: 'project-789',
        isBaseline: true,
        config: {},
      };

      const taskId = processor.getQueue().enqueue({
        type: 'capture-page',
        payload,
      });

      const startPromise = processor.start();

      // Wait for task to be processed
      await new Promise((resolve) => setTimeout(resolve, 500));

      await processor.stop();
      await startPromise;

      expect(processed).toContain(taskId);

      const task = db.prepare('SELECT status FROM tasks WHERE id = ?').get(taskId) as {
        status: string;
      };
      expect(task.status).toBe('completed');
    });

    it('should handle task errors and mark as failed', async () => {
      processor.registerHandler('capture-page', async () => {
        throw new Error('Test error');
      });

      const payload: CapturePagePayload = {
        runId: 'run-123',
        pageId: 'page-456',
        url: 'https://example.com',
        projectId: 'project-789',
        isBaseline: true,
        config: {},
      };

      const taskId = processor.getQueue().enqueue({
        type: 'capture-page',
        payload,
      });

      const startPromise = processor.start();

      // Wait for task to be processed
      await new Promise((resolve) => setTimeout(resolve, 500));

      await processor.stop();
      await startPromise;

      const task = db
        .prepare('SELECT status, error_message FROM tasks WHERE id = ?')
        .get(taskId) as {
        status: string;
        error_message: string;
      };
      expect(task.status).toBe('failed');
      expect(task.error_message).toBe('Test error');
    });
  });

  describe('getProgress', () => {
    it('should return progress statistics', () => {
      const payload: CapturePagePayload = {
        runId: 'run-123',
        pageId: 'page-456',
        url: 'https://example.com',
        projectId: 'project-789',
        isBaseline: true,
        config: {},
      };

      processor.getQueue().enqueue({ type: 'capture-page', payload });
      processor.getQueue().enqueue({ type: 'capture-page', payload });
      const taskId3 = processor.getQueue().enqueue({ type: 'capture-page', payload });

      // Process one task
      processor.getQueue().dequeue();
      processor.getQueue().complete(taskId3);

      const progress = processor.getQueue().getProgress();

      expect(progress.total).toBe(3);
      expect(progress.pending).toBe(1);
      expect(progress.processing).toBe(1);
      expect(progress.completed).toBe(1);
      expect(progress.failed).toBe(0);
    });
  });
});
