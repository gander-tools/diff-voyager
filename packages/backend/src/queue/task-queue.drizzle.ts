/**
 * TaskQueueDrizzle - Drizzle ORM implementation
 * Type-safe task queue with transaction support
 */

import { randomUUID } from 'node:crypto';
import { count, eq, sql } from 'drizzle-orm';
import type { DrizzleDb } from '../storage/drizzle/db.js';
import { tasks } from '../storage/drizzle/schema/index.js';
import type { ITaskQueue } from './interfaces/task-queue.interface.js';
import type { CreateTaskOptions, Task } from './types.js';

/**
 * Drizzle-based implementation of TaskQueue
 * Provides type-safe queries with transaction support for atomic operations
 */
export class TaskQueueDrizzle implements ITaskQueue {
  constructor(private db: DrizzleDb) {}

  enqueue(options: CreateTaskOptions): string {
    const taskId = randomUUID();
    const priority = options.priority ?? 'normal';
    const maxAttempts = options.maxAttempts ?? 3;
    const createdAt = new Date().toISOString();

    this.db
      .insert(tasks)
      .values({
        id: taskId,
        type: options.type,
        status: 'pending',
        priority,
        payloadJson: JSON.stringify(options.payload),
        attempts: 0,
        maxAttempts,
        errorMessage: null,
        createdAt,
        startedAt: null,
        completedAt: null,
      })
      .run();

    return taskId;
  }

  dequeue(): Task | null {
    // Use transaction to atomically select and update the task
    return this.db.transaction((tx) => {
      // Select the next pending task with highest priority
      // Priority order: high (3) > normal (2) > low (1)
      // Within same priority, oldest first (FIFO)
      const rows = tx
        .select()
        .from(tasks)
        .where(eq(tasks.status, 'pending'))
        .orderBy(
          sql`CASE ${tasks.priority}
						WHEN 'high' THEN 3
						WHEN 'normal' THEN 2
						WHEN 'low' THEN 1
					END DESC`,
          tasks.createdAt,
        )
        .limit(1)
        .all();

      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];

      // Update the task status to processing
      const startedAt = new Date().toISOString();
      tx.update(tasks)
        .set({
          status: 'processing',
          startedAt,
          attempts: sql`${tasks.attempts} + 1`,
        })
        .where(eq(tasks.id, row.id))
        .run();

      // Fetch the updated task
      const updatedRows = tx.select().from(tasks).where(eq(tasks.id, row.id)).all();

      if (updatedRows.length === 0) {
        return null;
      }

      return this.rowToTask(updatedRows[0]);
    });
  }

  complete(taskId: string): void {
    const completedAt = new Date().toISOString();
    this.db
      .update(tasks)
      .set({
        status: 'completed',
        completedAt,
      })
      .where(eq(tasks.id, taskId))
      .run();
  }

  fail(taskId: string, errorMessage: string): void {
    const completedAt = new Date().toISOString();
    this.db
      .update(tasks)
      .set({
        status: 'failed',
        errorMessage,
        completedAt,
      })
      .where(eq(tasks.id, taskId))
      .run();
  }

  retry(taskId: string): void {
    this.db
      .update(tasks)
      .set({
        status: 'pending',
        completedAt: null,
        errorMessage: null,
      })
      .where(eq(tasks.id, taskId))
      .run();
  }

  requeueStaleProcessingTasks(timeoutMs: number): number {
    const timeoutSeconds = Math.floor(timeoutMs / 1000);

    // Requeue tasks where:
    // 1. status = 'processing'
    // 2. started_at < now - timeout
    // 3. attempts < max_attempts
    const result = this.db
      .update(tasks)
      .set({
        status: 'pending',
        startedAt: null,
      })
      .where(
        sql`${tasks.status} = 'processing'
				AND datetime(${tasks.startedAt}) < datetime('now', '-' || ${timeoutSeconds} || ' seconds')
				AND ${tasks.attempts} < ${tasks.maxAttempts}`,
      )
      .run();

    return result.changes;
  }

  findById(taskId: string): Task | null {
    const rows = this.db.select().from(tasks).where(eq(tasks.id, taskId)).all();

    if (rows.length === 0) {
      return null;
    }

    return this.rowToTask(rows[0]);
  }

  getProgress(): {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  } {
    const result = this.db
      .select({
        pending: sql<number>`SUM(CASE WHEN ${tasks.status} = 'pending' THEN 1 ELSE 0 END)`,
        processing: sql<number>`SUM(CASE WHEN ${tasks.status} = 'processing' THEN 1 ELSE 0 END)`,
        completed: sql<number>`SUM(CASE WHEN ${tasks.status} = 'completed' THEN 1 ELSE 0 END)`,
        failed: sql<number>`SUM(CASE WHEN ${tasks.status} = 'failed' THEN 1 ELSE 0 END)`,
        total: count(),
      })
      .from(tasks)
      .get();

    return {
      pending: result?.pending ?? 0,
      processing: result?.processing ?? 0,
      completed: result?.completed ?? 0,
      failed: result?.failed ?? 0,
      total: result?.total ?? 0,
    };
  }

  /**
   * Convert database row to Task object
   */
  private rowToTask(row: typeof tasks.$inferSelect): Task {
    return {
      id: row.id,
      type: row.type as Task['type'],
      status: row.status as Task['status'],
      priority: row.priority as Task['priority'],
      payload: JSON.parse(row.payloadJson),
      attempts: row.attempts,
      maxAttempts: row.maxAttempts,
      error: row.errorMessage ?? undefined,
      createdAt: new Date(row.createdAt),
      startedAt: row.startedAt ? new Date(row.startedAt) : undefined,
      completedAt: row.completedAt ? new Date(row.completedAt) : undefined,
    };
  }
}
