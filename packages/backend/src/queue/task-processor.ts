/**
 * Task processor for background task execution
 */

import type { DatabaseInstance } from '../storage/database.js';
import type { Task } from './types.js';
import { TaskQueue } from './task-queue.js';

/**
 * Task handler function type
 */
export type TaskHandler = (task: Task) => Promise<void>;

/**
 * TaskProcessor processes tasks from the queue in the background
 */
export class TaskProcessor {
  private queue: TaskQueue;
  private handlers: Map<string, TaskHandler>;
  private running = false;
  private processing = false;

  constructor(db: DatabaseInstance) {
    this.queue = new TaskQueue(db);
    this.handlers = new Map();
  }

  /**
   * Register a handler for a specific task type
   */
  registerHandler(taskType: string, handler: TaskHandler): void {
    this.handlers.set(taskType, handler);
  }

  /**
   * Start processing tasks
   */
  async start(): Promise<void> {
    if (this.running) {
      throw new Error('TaskProcessor is already running');
    }

    this.running = true;
    await this.processLoop();
  }

  /**
   * Stop processing tasks gracefully
   */
  async stop(): Promise<void> {
    this.running = false;

    // Wait for current task to complete
    while (this.processing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Get current running status
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Main processing loop
   */
  private async processLoop(): Promise<void> {
    while (this.running) {
      const task = this.queue.dequeue();

      if (!task) {
        // No tasks available, wait before checking again
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      await this.processTask(task);
    }
  }

  /**
   * Process a single task
   */
  private async processTask(task: Task): Promise<void> {
    this.processing = true;

    try {
      const handler = this.handlers.get(task.type);

      if (!handler) {
        throw new Error(`No handler registered for task type: ${task.type}`);
      }

      await handler(task);
      this.queue.complete(task.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.queue.fail(task.id, errorMessage);
    } finally {
      this.processing = false;
    }
  }

  /**
   * Get task queue instance for status queries
   */
  getQueue(): TaskQueue {
    return this.queue;
  }
}
