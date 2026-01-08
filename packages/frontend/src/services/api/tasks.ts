import { get } from './client';

/**
 * Task status
 */
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Task details response
 */
export interface TaskDetailsResponse {
  id: string;
  type: string;
  status: TaskStatus;
  attempts: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  result?: unknown;
}

/**
 * Get task status by ID
 * GET /tasks/:taskId
 */
export function getTask(taskId: string): Promise<TaskDetailsResponse> {
  return get<TaskDetailsResponse>(`/tasks/${taskId}`);
}

/**
 * Poll task until completion
 * Polls every `intervalMs` milliseconds until task is completed or failed
 *
 * @param taskId Task ID to poll
 * @param intervalMs Polling interval in milliseconds (default: 3000)
 * @param maxAttempts Maximum polling attempts (default: 100)
 * @returns Promise that resolves with final task status
 */
export async function pollTask(
  taskId: string,
  intervalMs = 3000,
  maxAttempts = 100,
): Promise<TaskDetailsResponse> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const task = await getTask(taskId);

    // Task is complete or failed
    if (task.status === 'completed' || task.status === 'failed') {
      return task;
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    attempts++;
  }

  throw new Error(`Task ${taskId} polling timeout after ${maxAttempts} attempts`);
}
