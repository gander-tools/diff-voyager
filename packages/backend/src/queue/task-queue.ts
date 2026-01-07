/**
 * Task queue for asynchronous job processing
 */

import { randomUUID } from 'node:crypto';
import type { DatabaseInstance } from '../storage/database.js';
import type { CreateTaskOptions, Task } from './types.js';

/**
 * Database row representation of a task
 */
interface TaskRow {
  id: string;
  type: string;
  status: string;
  priority: string;
  payload_json: string;
  attempts: number;
  max_attempts: number;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

/**
 * TaskQueue manages the lifecycle of tasks in the queue
 */
export class TaskQueue {
  constructor(private db: DatabaseInstance) {}

  /**
   * Add a task to the queue
   *
   * @param options - Task creation options
   * @returns The ID of the created task
   */
  enqueue(options: CreateTaskOptions): string {
    const taskId = randomUUID();
    const priority = options.priority ?? 'normal';
    const maxAttempts = options.maxAttempts ?? 3;

    const stmt = this.db.prepare(`
      INSERT INTO tasks (
        id,
        type,
        status,
        priority,
        payload_json,
        attempts,
        max_attempts
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      taskId,
      options.type,
      'pending',
      priority,
      JSON.stringify(options.payload),
      0,
      maxAttempts,
    );

    return taskId;
  }

  /**
   * Get next pending task from the queue and mark it as processing
   *
   * @returns The next task or null if queue is empty
   */
  dequeue(): Task | null {
    // Use a transaction to atomically select and update the task
    const dequeueTransaction = this.db.transaction(() => {
      // Select the next pending task with highest priority
      const selectStmt = this.db.prepare<[], TaskRow>(`
        SELECT *
        FROM tasks
        WHERE status = 'pending'
        ORDER BY
          CASE priority
            WHEN 'high' THEN 3
            WHEN 'normal' THEN 2
            WHEN 'low' THEN 1
          END DESC,
          created_at ASC
        LIMIT 1
      `);

      const row = selectStmt.get();

      if (!row) {
        return null;
      }

      // Update the task status to processing
      const updateStmt = this.db.prepare(`
        UPDATE tasks
        SET
          status = 'processing',
          started_at = CURRENT_TIMESTAMP,
          attempts = attempts + 1
        WHERE id = ?
      `);

      updateStmt.run(row.id);

      // Fetch the updated task
      const updatedRow = this.db
        .prepare<[string], TaskRow>('SELECT * FROM tasks WHERE id = ?')
        .get(row.id);

      if (!updatedRow) {
        return null;
      }

      return this.rowToTask(updatedRow);
    });

    return dequeueTransaction();
  }

  /**
   * Mark a task as completed
   *
   * @param taskId - ID of the task to complete
   */
  complete(taskId: string): void {
    const stmt = this.db.prepare(`
      UPDATE tasks
      SET
        status = 'completed',
        completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(taskId);
  }

  /**
   * Mark a task as failed with an error message
   *
   * @param taskId - ID of the task that failed
   * @param errorMessage - Description of the error
   */
  fail(taskId: string, errorMessage: string): void {
    const stmt = this.db.prepare(`
      UPDATE tasks
      SET
        status = 'failed',
        error_message = ?,
        completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(errorMessage, taskId);
  }

  /**
   * Retry a failed task by resetting it to pending status
   *
   * @param taskId - ID of the task to retry
   */
  retry(taskId: string): void {
    const stmt = this.db.prepare(`
      UPDATE tasks
      SET
        status = 'pending',
        completed_at = NULL,
        error_message = NULL
      WHERE id = ?
    `);

    stmt.run(taskId);
  }

  /**
   * Requeue stale processing tasks that have been running too long
   *
   * Only requeues tasks that haven't exceeded max_attempts
   *
   * @param timeoutMs - Timeout in milliseconds
   * @returns Number of tasks requeued
   */
  requeueStaleProcessingTasks(timeoutMs: number): number {
    const timeoutSeconds = Math.floor(timeoutMs / 1000);

    const stmt = this.db.prepare(`
      UPDATE tasks
      SET
        status = 'pending',
        started_at = NULL
      WHERE status = 'processing'
        AND datetime(started_at) < datetime('now', '-' || ? || ' seconds')
        AND attempts < max_attempts
    `);

    const result = stmt.run(timeoutSeconds);
    return result.changes;
  }

  /**
   * Convert database row to Task object
   */
  private rowToTask(row: TaskRow): Task {
    return {
      id: row.id,
      type: row.type as Task['type'],
      status: row.status as Task['status'],
      priority: row.priority as Task['priority'],
      payload: JSON.parse(row.payload_json),
      attempts: row.attempts,
      maxAttempts: row.max_attempts,
      error: row.error_message ?? undefined,
      createdAt: new Date(row.created_at),
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    };
  }
}
