/**
 * Page-specific task queue operations
 */

import type { DatabaseInstance } from '../storage/database.js';
import { TaskQueue } from './task-queue.js';
import type { CapturePagePayload, TaskPriority } from './types.js';

/**
 * PageTaskQueue extends TaskQueue with page-specific batch operations
 */
export class PageTaskQueue extends TaskQueue {
  constructor(db: DatabaseInstance) {
    super(db);
  }

  /**
   * Enqueue multiple page capture tasks at once
   *
   * @param pages - Array of page capture payloads
   * @param priority - Priority for all tasks (default: normal)
   * @param maxAttempts - Max attempts for all tasks (default: 3)
   * @returns Array of task IDs
   */
  enqueueBatch(
    pages: CapturePagePayload[],
    priority: TaskPriority = 'normal',
    maxAttempts = 3,
  ): string[] {
    const taskIds: string[] = [];

    for (const page of pages) {
      const taskId = this.enqueue({
        type: 'capture-page',
        payload: page,
        priority,
        maxAttempts,
      });
      taskIds.push(taskId);
    }

    return taskIds;
  }
}
