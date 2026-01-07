/**
 * Tests for TaskQueue.enqueue()
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync, rmSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createDatabase, closeDatabase } from '../../../src/storage/database.js';
import { TaskQueue } from '../../../src/queue/task-queue.js';
import type { CapturePagePayload } from '../../../src/queue/types.js';

describe('TaskQueue.enqueue()', () => {
  let testDir: string;
  let dbPath: string;
  let db: Database.Database;
  let taskQueue: TaskQueue;

  beforeEach(() => {
    testDir = join(tmpdir(), `diff-voyager-test-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });
    dbPath = join(testDir, 'test.db');
    db = createDatabase({ dbPath, artifactsDir: join(testDir, 'artifacts') });
    taskQueue = new TaskQueue(db);
  });

  afterEach(() => {
    closeDatabase(db);
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should insert task with generated UUID', () => {
    const payload: CapturePagePayload = {
      runId: 'run-123',
      pageId: 'page-456',
      url: 'https://example.com',
      projectId: 'project-789',
      isBaseline: true,
      config: {},
    };

    const taskId = taskQueue.enqueue({
      type: 'capture-page',
      payload,
    });

    expect(taskId).toBeDefined();
    expect(typeof taskId).toBe('string');
    expect(taskId.length).toBeGreaterThan(0);

    // Verify task was inserted
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    expect(task).toBeDefined();
  });

  it('should insert task with pending status', () => {
    const payload: CapturePagePayload = {
      runId: 'run-123',
      pageId: 'page-456',
      url: 'https://example.com',
      projectId: 'project-789',
      isBaseline: false,
      config: {},
    };

    const taskId = taskQueue.enqueue({
      type: 'capture-page',
      payload,
    });

    const task = db.prepare('SELECT status FROM tasks WHERE id = ?').get(taskId) as {
      status: string;
    };
    expect(task.status).toBe('pending');
  });

  it('should insert task with default normal priority', () => {
    const payload: CapturePagePayload = {
      runId: 'run-123',
      pageId: 'page-456',
      url: 'https://example.com',
      projectId: 'project-789',
      isBaseline: true,
      config: {},
    };

    const taskId = taskQueue.enqueue({
      type: 'capture-page',
      payload,
    });

    const task = db.prepare('SELECT priority FROM tasks WHERE id = ?').get(taskId) as {
      priority: string;
    };
    expect(task.priority).toBe('normal');
  });

  it('should insert task with custom priority', () => {
    const payload: CapturePagePayload = {
      runId: 'run-123',
      pageId: 'page-456',
      url: 'https://example.com',
      projectId: 'project-789',
      isBaseline: true,
      config: {},
    };

    const taskId = taskQueue.enqueue({
      type: 'capture-page',
      payload,
      priority: 'high',
    });

    const task = db.prepare('SELECT priority FROM tasks WHERE id = ?').get(taskId) as {
      priority: string;
    };
    expect(task.priority).toBe('high');
  });

  it('should store payload as JSON', () => {
    const payload: CapturePagePayload = {
      runId: 'run-123',
      pageId: 'page-456',
      url: 'https://example.com',
      projectId: 'project-789',
      isBaseline: true,
      config: {
        viewport: { width: 1920, height: 1080 },
        collectHar: true,
      },
    };

    const taskId = taskQueue.enqueue({
      type: 'capture-page',
      payload,
    });

    const task = db.prepare('SELECT payload_json FROM tasks WHERE id = ?').get(taskId) as {
      payload_json: string;
    };
    const storedPayload = JSON.parse(task.payload_json);

    expect(storedPayload).toEqual(payload);
  });

  it('should set attempts to 0', () => {
    const payload: CapturePagePayload = {
      runId: 'run-123',
      pageId: 'page-456',
      url: 'https://example.com',
      projectId: 'project-789',
      isBaseline: true,
      config: {},
    };

    const taskId = taskQueue.enqueue({
      type: 'capture-page',
      payload,
    });

    const task = db.prepare('SELECT attempts FROM tasks WHERE id = ?').get(taskId) as {
      attempts: number;
    };
    expect(task.attempts).toBe(0);
  });

  it('should set default max_attempts to 3', () => {
    const payload: CapturePagePayload = {
      runId: 'run-123',
      pageId: 'page-456',
      url: 'https://example.com',
      projectId: 'project-789',
      isBaseline: true,
      config: {},
    };

    const taskId = taskQueue.enqueue({
      type: 'capture-page',
      payload,
    });

    const task = db.prepare('SELECT max_attempts FROM tasks WHERE id = ?').get(taskId) as {
      max_attempts: number;
    };
    expect(task.max_attempts).toBe(3);
  });

  it('should set custom max_attempts', () => {
    const payload: CapturePagePayload = {
      runId: 'run-123',
      pageId: 'page-456',
      url: 'https://example.com',
      projectId: 'project-789',
      isBaseline: true,
      config: {},
    };

    const taskId = taskQueue.enqueue({
      type: 'capture-page',
      payload,
      maxAttempts: 5,
    });

    const task = db.prepare('SELECT max_attempts FROM tasks WHERE id = ?').get(taskId) as {
      max_attempts: number;
    };
    expect(task.max_attempts).toBe(5);
  });

  it('should set created_at timestamp', () => {
    const payload: CapturePagePayload = {
      runId: 'run-123',
      pageId: 'page-456',
      url: 'https://example.com',
      projectId: 'project-789',
      isBaseline: true,
      config: {},
    };

    const before = Date.now();
    const taskId = taskQueue.enqueue({
      type: 'capture-page',
      payload,
    });
    const after = Date.now();

    const task = db.prepare('SELECT created_at FROM tasks WHERE id = ?').get(taskId) as {
      created_at: string;
    };
    const createdAt = new Date(task.created_at).getTime();

    // Allow 1 second tolerance for timestamp differences
    expect(createdAt).toBeGreaterThanOrEqual(before - 1000);
    expect(createdAt).toBeLessThanOrEqual(after + 1000);
  });

  it('should allow multiple tasks to be enqueued', () => {
    const payload1: CapturePagePayload = {
      runId: 'run-123',
      pageId: 'page-456',
      url: 'https://example.com/page1',
      projectId: 'project-789',
      isBaseline: true,
      config: {},
    };

    const payload2: CapturePagePayload = {
      runId: 'run-123',
      pageId: 'page-457',
      url: 'https://example.com/page2',
      projectId: 'project-789',
      isBaseline: true,
      config: {},
    };

    const taskId1 = taskQueue.enqueue({ type: 'capture-page', payload: payload1 });
    const taskId2 = taskQueue.enqueue({ type: 'capture-page', payload: payload2 });

    expect(taskId1).not.toBe(taskId2);

    const count = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number };
    expect(count.count).toBe(2);
  });
});

describe('TaskQueue.dequeue()', () => {
  let testDir: string;
  let dbPath: string;
  let db: Database.Database;
  let taskQueue: TaskQueue;

  beforeEach(() => {
    testDir = join(tmpdir(), `diff-voyager-test-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });
    dbPath = join(testDir, 'test.db');
    db = createDatabase({ dbPath, artifactsDir: join(testDir, 'artifacts') });
    taskQueue = new TaskQueue(db);
  });

  afterEach(() => {
    closeDatabase(db);
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should return null when no pending tasks', () => {
    const task = taskQueue.dequeue();
    expect(task).toBeNull();
  });

  it('should return and lock oldest pending task', () => {
    const payload: CapturePagePayload = {
      runId: 'run-123',
      pageId: 'page-456',
      url: 'https://example.com',
      projectId: 'project-789',
      isBaseline: true,
      config: {},
    };

    const taskId = taskQueue.enqueue({ type: 'capture-page', payload });

    const task = taskQueue.dequeue();

    expect(task).not.toBeNull();
    expect(task?.id).toBe(taskId);
    expect(task?.type).toBe('capture-page');
    expect(task?.status).toBe('processing');
  });

  it('should set started_at timestamp when dequeuing', () => {
    const payload: CapturePagePayload = {
      runId: 'run-123',
      pageId: 'page-456',
      url: 'https://example.com',
      projectId: 'project-789',
      isBaseline: true,
      config: {},
    };

    taskQueue.enqueue({ type: 'capture-page', payload });

    const before = Date.now();
    const task = taskQueue.dequeue();
    const after = Date.now();

    expect(task?.startedAt).toBeDefined();
    expect(task!.startedAt!.getTime()).toBeGreaterThanOrEqual(before - 1000);
    expect(task!.startedAt!.getTime()).toBeLessThanOrEqual(after + 1000);
  });

  it('should increment attempts counter', () => {
    const payload: CapturePagePayload = {
      runId: 'run-123',
      pageId: 'page-456',
      url: 'https://example.com',
      projectId: 'project-789',
      isBaseline: true,
      config: {},
    };

    taskQueue.enqueue({ type: 'capture-page', payload });

    const task = taskQueue.dequeue();

    expect(task?.attempts).toBe(1);
  });

  it('should deserialize payload from JSON', () => {
    const payload: CapturePagePayload = {
      runId: 'run-123',
      pageId: 'page-456',
      url: 'https://example.com',
      projectId: 'project-789',
      isBaseline: true,
      config: {
        viewport: { width: 1920, height: 1080 },
        collectHar: true,
      },
    };

    taskQueue.enqueue({ type: 'capture-page', payload });

    const task = taskQueue.dequeue();

    expect(task?.payload).toEqual(payload);
  });

  it('should respect priority order (high > normal > low)', () => {
    const payload: CapturePagePayload = {
      runId: 'run-123',
      pageId: 'page-456',
      url: 'https://example.com',
      projectId: 'project-789',
      isBaseline: true,
      config: {},
    };

    // Enqueue in reverse priority order
    const lowId = taskQueue.enqueue({ type: 'capture-page', payload, priority: 'low' });
    const normalId = taskQueue.enqueue({ type: 'capture-page', payload, priority: 'normal' });
    const highId = taskQueue.enqueue({ type: 'capture-page', payload, priority: 'high' });

    // Should dequeue high priority first
    const task1 = taskQueue.dequeue();
    expect(task1?.id).toBe(highId);

    // Then normal
    const task2 = taskQueue.dequeue();
    expect(task2?.id).toBe(normalId);

    // Then low
    const task3 = taskQueue.dequeue();
    expect(task3?.id).toBe(lowId);
  });

  it('should return oldest task when priority is equal', () => {
    const payload: CapturePagePayload = {
      runId: 'run-123',
      pageId: 'page-456',
      url: 'https://example.com',
      projectId: 'project-789',
      isBaseline: true,
      config: {},
    };

    const taskId1 = taskQueue.enqueue({ type: 'capture-page', payload, priority: 'normal' });
    const taskId2 = taskQueue.enqueue({ type: 'capture-page', payload, priority: 'normal' });

    const task1 = taskQueue.dequeue();
    expect(task1?.id).toBe(taskId1);

    const task2 = taskQueue.dequeue();
    expect(task2?.id).toBe(taskId2);
  });

  it('should not dequeue tasks that are already processing', () => {
    const payload: CapturePagePayload = {
      runId: 'run-123',
      pageId: 'page-456',
      url: 'https://example.com',
      projectId: 'project-789',
      isBaseline: true,
      config: {},
    };

    taskQueue.enqueue({ type: 'capture-page', payload });

    // First dequeue should succeed
    const task1 = taskQueue.dequeue();
    expect(task1).not.toBeNull();

    // Second dequeue should return null (no more pending tasks)
    const task2 = taskQueue.dequeue();
    expect(task2).toBeNull();
  });

  it('should not dequeue completed tasks', () => {
    const payload: CapturePagePayload = {
      runId: 'run-123',
      pageId: 'page-456',
      url: 'https://example.com',
      projectId: 'project-789',
      isBaseline: true,
      config: {},
    };

    const taskId = taskQueue.enqueue({ type: 'capture-page', payload });

    // Mark task as completed directly in DB
    db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run('completed', taskId);

    const task = taskQueue.dequeue();
    expect(task).toBeNull();
  });

  it('should not dequeue failed tasks', () => {
    const payload: CapturePagePayload = {
      runId: 'run-123',
      pageId: 'page-456',
      url: 'https://example.com',
      projectId: 'project-789',
      isBaseline: true,
      config: {},
    };

    const taskId = taskQueue.enqueue({ type: 'capture-page', payload });

    // Mark task as failed directly in DB
    db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run('failed', taskId);

    const task = taskQueue.dequeue();
    expect(task).toBeNull();
  });
});
