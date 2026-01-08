/**
 * Task Queue Interface
 * Defines the contract for TaskQueue implementations
 */

import type { CreateTaskOptions, Task } from '../types.js';

/**
 * Interface for Task Queue operations
 * Implemented by both SQL and Drizzle versions during migration
 */
export interface ITaskQueue {
  /**
   * Add a task to the queue
   * @param options - Task creation options
   * @returns The ID of the created task
   */
  enqueue(options: CreateTaskOptions): string;

  /**
   * Get next pending task from the queue and mark it as processing
   * Uses transaction for atomic operation
   * @returns The next task or null if queue is empty
   */
  dequeue(): Task | null;

  /**
   * Mark a task as completed
   * @param taskId - ID of the task to complete
   */
  complete(taskId: string): void;

  /**
   * Mark a task as failed with an error message
   * @param taskId - ID of the task that failed
   * @param errorMessage - Description of the error
   */
  fail(taskId: string, errorMessage: string): void;

  /**
   * Retry a failed task by resetting it to pending status
   * @param taskId - ID of the task to retry
   */
  retry(taskId: string): void;

  /**
   * Requeue stale processing tasks that have been running too long
   * Only requeues tasks that haven't exceeded max_attempts
   * @param timeoutMs - Timeout in milliseconds
   * @returns Number of tasks requeued
   */
  requeueStaleProcessingTasks(timeoutMs: number): number;

  /**
   * Find a task by ID
   * @param taskId - ID of the task to find
   * @returns The task or null if not found
   */
  findById(taskId: string): Task | null;

  /**
   * Get task progress statistics
   * @returns Progress statistics
   */
  getProgress(): {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  };
}
