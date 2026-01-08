/**
 * TaskQueueDrizzle unit tests (TDD)
 * These tests are written BEFORE the implementation
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TaskQueueDrizzle } from '../../../src/queue/task-queue.drizzle.js';
import type { CreateTaskOptions } from '../../../src/queue/types.js';
import { createDatabase } from '../../../src/storage/database.js';
import { createDrizzleDb, type DrizzleDb } from '../../../src/storage/drizzle/db.js';
import { cleanupTestDb, createTestDb, type TestDatabase } from '../../helpers/test-db.js';

describe('TaskQueueDrizzle', () => {
  let sqliteDb: TestDatabase;
  let drizzleDb: DrizzleDb;
  let queue: TaskQueueDrizzle;

  beforeEach(async () => {
    sqliteDb = await createTestDb();
    createDatabase({ dbPath: sqliteDb.name, baseDir: '', artifactsDir: '' });
    sqliteDb.close();
    sqliteDb = (await import('better-sqlite3')).default(sqliteDb.name);
    drizzleDb = createDrizzleDb(sqliteDb);
    queue = new TaskQueueDrizzle(drizzleDb);
  });

  afterEach(async () => {
    await cleanupTestDb(sqliteDb);
  });

  describe('enqueue', () => {
    it('should create task with pending status', () => {
      const options: CreateTaskOptions = {
        type: 'capture-page',
        payload: {
          runId: 'run-1',
          pageId: 'page-1',
          url: 'http://example.com',
          projectId: 'project-1',
          isBaseline: true,
          config: {},
        },
      };

      const taskId = queue.enqueue(options);

      expect(taskId).toMatch(/^[0-9a-f-]{36}$/);

      const task = queue.findById(taskId);
      expect(task).not.toBeNull();
      expect(task?.status).toBe('pending');
      expect(task?.type).toBe('capture-page');
      expect(task?.attempts).toBe(0);
    });

    it('should use default priority and maxAttempts', () => {
      const options: CreateTaskOptions = {
        type: 'crawl-site',
        payload: {
          runId: 'run-1',
          projectId: 'project-1',
          startUrl: 'http://example.com',
          isBaseline: false,
          config: {},
        },
      };

      const taskId = queue.enqueue(options);
      const task = queue.findById(taskId);

      expect(task?.priority).toBe('normal');
      expect(task?.maxAttempts).toBe(3);
    });

    it('should accept custom priority and maxAttempts', () => {
      const options: CreateTaskOptions = {
        type: 'compare-runs',
        payload: {
          projectId: 'project-1',
          baselineRunId: 'run-1',
          comparisonRunId: 'run-2',
        },
        priority: 'high',
        maxAttempts: 5,
      };

      const taskId = queue.enqueue(options);
      const task = queue.findById(taskId);

      expect(task?.priority).toBe('high');
      expect(task?.maxAttempts).toBe(5);
    });

    it('should serialize payload JSON', () => {
      const options: CreateTaskOptions = {
        type: 'capture-page',
        payload: {
          runId: 'run-1',
          pageId: 'page-1',
          url: 'http://example.com',
          projectId: 'project-1',
          isBaseline: true,
          config: { viewport: { width: 1920, height: 1080 } },
        },
      };

      const taskId = queue.enqueue(options);
      const task = queue.findById(taskId);

      expect(task?.payload).toEqual(options.payload);
    });
  });

  describe('dequeue', () => {
    it('should return null when queue is empty', () => {
      const task = queue.dequeue();
      expect(task).toBeNull();
    });

    it('should return next pending task', () => {
      const taskId = queue.enqueue({
        type: 'capture-page',
        payload: {
          runId: 'run-1',
          pageId: 'page-1',
          url: 'http://example.com',
          projectId: 'project-1',
          isBaseline: true,
          config: {},
        },
      });

      const task = queue.dequeue();

      expect(task).not.toBeNull();
      expect(task?.id).toBe(taskId);
      expect(task?.status).toBe('processing');
      expect(task?.attempts).toBe(1);
      expect(task?.startedAt).toBeInstanceOf(Date);
    });

    it('should respect priority order (high > normal > low)', () => {
      const lowId = queue.enqueue({
        type: 'capture-page',
        payload: {
          runId: 'run-1',
          pageId: 'page-1',
          url: 'http://low.com',
          projectId: 'project-1',
          isBaseline: true,
          config: {},
        },
        priority: 'low',
      });

      const normalId = queue.enqueue({
        type: 'capture-page',
        payload: {
          runId: 'run-1',
          pageId: 'page-2',
          url: 'http://normal.com',
          projectId: 'project-1',
          isBaseline: true,
          config: {},
        },
        priority: 'normal',
      });

      const highId = queue.enqueue({
        type: 'capture-page',
        payload: {
          runId: 'run-1',
          pageId: 'page-3',
          url: 'http://high.com',
          projectId: 'project-1',
          isBaseline: true,
          config: {},
        },
        priority: 'high',
      });

      const first = queue.dequeue();
      const second = queue.dequeue();
      const third = queue.dequeue();

      expect(first?.id).toBe(highId);
      expect(second?.id).toBe(normalId);
      expect(third?.id).toBe(lowId);
    });

    it('should respect FIFO order for same priority', () => {
      const firstId = queue.enqueue({
        type: 'capture-page',
        payload: {
          runId: 'run-1',
          pageId: 'page-1',
          url: 'http://first.com',
          projectId: 'project-1',
          isBaseline: true,
          config: {},
        },
      });

      // Small delay to ensure different timestamps
      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      sleep(5);

      const secondId = queue.enqueue({
        type: 'capture-page',
        payload: {
          runId: 'run-1',
          pageId: 'page-2',
          url: 'http://second.com',
          projectId: 'project-1',
          isBaseline: true,
          config: {},
        },
      });

      const first = queue.dequeue();
      const second = queue.dequeue();

      expect(first?.id).toBe(firstId);
      expect(second?.id).toBe(secondId);
    });

    it('should skip processing tasks', () => {
      queue.enqueue({
        type: 'capture-page',
        payload: {
          runId: 'run-1',
          pageId: 'page-1',
          url: 'http://processing.com',
          projectId: 'project-1',
          isBaseline: true,
          config: {},
        },
      });

      const secondId = queue.enqueue({
        type: 'capture-page',
        payload: {
          runId: 'run-1',
          pageId: 'page-2',
          url: 'http://pending.com',
          projectId: 'project-1',
          isBaseline: true,
          config: {},
        },
      });

      // Dequeue first task (now processing)
      queue.dequeue();

      // Dequeue should return second task
      const task = queue.dequeue();
      expect(task?.id).toBe(secondId);
    });
  });

  describe('complete', () => {
    it('should mark task as completed', () => {
      const taskId = queue.enqueue({
        type: 'capture-page',
        payload: {
          runId: 'run-1',
          pageId: 'page-1',
          url: 'http://example.com',
          projectId: 'project-1',
          isBaseline: true,
          config: {},
        },
      });

      queue.dequeue(); // Mark as processing
      queue.complete(taskId);

      const task = queue.findById(taskId);
      expect(task?.status).toBe('completed');
      expect(task?.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('fail', () => {
    it('should mark task as failed with error message', () => {
      const taskId = queue.enqueue({
        type: 'capture-page',
        payload: {
          runId: 'run-1',
          pageId: 'page-1',
          url: 'http://example.com',
          projectId: 'project-1',
          isBaseline: true,
          config: {},
        },
      });

      queue.dequeue(); // Mark as processing
      queue.fail(taskId, 'Network timeout');

      const task = queue.findById(taskId);
      expect(task?.status).toBe('failed');
      expect(task?.error).toBe('Network timeout');
      expect(task?.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('retry', () => {
    it('should reset failed task to pending', () => {
      const taskId = queue.enqueue({
        type: 'capture-page',
        payload: {
          runId: 'run-1',
          pageId: 'page-1',
          url: 'http://example.com',
          projectId: 'project-1',
          isBaseline: true,
          config: {},
        },
      });

      queue.dequeue();
      queue.fail(taskId, 'Error');
      queue.retry(taskId);

      const task = queue.findById(taskId);
      expect(task?.status).toBe('pending');
      expect(task?.error).toBeUndefined();
      expect(task?.completedAt).toBeUndefined();
    });
  });

  describe('requeueStaleProcessingTasks', () => {
    it('should requeue tasks exceeding timeout', async () => {
      const taskId = queue.enqueue({
        type: 'capture-page',
        payload: {
          runId: 'run-1',
          pageId: 'page-1',
          url: 'http://example.com',
          projectId: 'project-1',
          isBaseline: true,
          config: {},
        },
      });

      queue.dequeue(); // Mark as processing

      // Manually set started_at to past time
      sqliteDb
        .prepare("UPDATE tasks SET started_at = datetime('now', '-2 hours') WHERE id = ?")
        .run(taskId);

      const requeued = queue.requeueStaleProcessingTasks(3600000); // 1 hour

      expect(requeued).toBe(1);

      const task = queue.findById(taskId);
      expect(task?.status).toBe('pending');
      expect(task?.startedAt).toBeUndefined();
    });

    it('should not requeue tasks within timeout', () => {
      queue.enqueue({
        type: 'capture-page',
        payload: {
          runId: 'run-1',
          pageId: 'page-1',
          url: 'http://example.com',
          projectId: 'project-1',
          isBaseline: true,
          config: {},
        },
      });

      queue.dequeue(); // Mark as processing (just now)

      const requeued = queue.requeueStaleProcessingTasks(3600000); // 1 hour

      expect(requeued).toBe(0);
    });

    it('should not requeue tasks that exceeded max attempts', () => {
      const taskId = queue.enqueue({
        type: 'capture-page',
        payload: {
          runId: 'run-1',
          pageId: 'page-1',
          url: 'http://example.com',
          projectId: 'project-1',
          isBaseline: true,
          config: {},
        },
        maxAttempts: 1,
      });

      queue.dequeue(); // attempts = 1

      // Manually set started_at to past time
      sqliteDb
        .prepare("UPDATE tasks SET started_at = datetime('now', '-2 hours') WHERE id = ?")
        .run(taskId);

      const requeued = queue.requeueStaleProcessingTasks(3600000);

      expect(requeued).toBe(0);
    });
  });

  describe('findById', () => {
    it('should return task when exists', () => {
      const taskId = queue.enqueue({
        type: 'capture-page',
        payload: {
          runId: 'run-1',
          pageId: 'page-1',
          url: 'http://example.com',
          projectId: 'project-1',
          isBaseline: true,
          config: {},
        },
      });

      const task = queue.findById(taskId);

      expect(task).not.toBeNull();
      expect(task?.id).toBe(taskId);
    });

    it('should return null when not exists', () => {
      const task = queue.findById('non-existent');
      expect(task).toBeNull();
    });
  });

  describe('getProgress', () => {
    it('should return zero stats when empty', () => {
      const stats = queue.getProgress();

      expect(stats).toEqual({
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        total: 0,
      });
    });

    it('should count tasks by status', () => {
      // Enqueue 5 tasks
      for (let i = 1; i <= 5; i++) {
        queue.enqueue({
          type: 'capture-page',
          payload: {
            runId: 'run-1',
            pageId: `page-${i}`,
            url: `http://example${i}.com`,
            projectId: 'project-1',
            isBaseline: true,
            config: {},
          },
        });
      }

      // Create 1 processing - dequeue returns the task that was set to processing
      const _processing = queue.dequeue();

      // Create 1 completed - dequeue and complete it
      const completed = queue.dequeue();
      if (completed) queue.complete(completed.id);

      // Create 1 failed - dequeue and fail it
      const failed = queue.dequeue();
      if (failed) queue.fail(failed.id, 'Error');

      // Now we should have:
      // - 2 pending (tasks 4 and 5)
      // - 1 processing (task 1)
      // - 1 completed (task 2)
      // - 1 failed (task 3)

      const stats = queue.getProgress();

      expect(stats).toEqual({
        pending: 2,
        processing: 1,
        completed: 1,
        failed: 1,
        total: 5,
      });
    });
  });
});
