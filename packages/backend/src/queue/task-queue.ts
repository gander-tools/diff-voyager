/**
 * Task queue for asynchronous job processing
 */

import { randomUUID } from 'node:crypto';
import type { DatabaseInstance } from '../storage/database.js';
import type { CreateTaskOptions } from './types.js';

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
}
