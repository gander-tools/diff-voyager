/**
 * Task queue types for asynchronous job processing
 */

/**
 * Task status in the queue
 */
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Task type - what kind of job to execute
 */
export type TaskType = 'capture-page' | 'crawl-site' | 'compare-runs';

/**
 * Priority levels for task execution
 */
export type TaskPriority = 'low' | 'normal' | 'high';

/**
 * Task payload for page capture
 */
export interface CapturePagePayload {
  runId: string;
  pageId: string;
  url: string;
  projectId: string;
  isBaseline: boolean;
  config: {
    viewport?: { width: number; height: number };
    collectHar?: boolean;
    waitAfterLoad?: number;
  };
}

/**
 * Task payload for site crawling
 */
export interface CrawlSitePayload {
  runId: string;
  projectId: string;
  startUrl: string;
  isBaseline: boolean;
  config: {
    maxPages?: number;
    maxDepth?: number;
    includePatterns?: string[];
    excludePatterns?: string[];
    viewport?: { width: number; height: number };
    collectHar?: boolean;
  };
}

/**
 * Task payload for run comparison
 */
export interface CompareRunsPayload {
  projectId: string;
  baselineRunId: string;
  comparisonRunId: string;
}

/**
 * Union of all task payloads
 */
export type TaskPayload = CapturePagePayload | CrawlSitePayload | CompareRunsPayload;

/**
 * Task record in the queue
 */
export interface Task {
  id: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  payload: TaskPayload;
  attempts: number;
  maxAttempts: number;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Options for creating a task
 */
export interface CreateTaskOptions {
  type: TaskType;
  payload: TaskPayload;
  priority?: TaskPriority;
  maxAttempts?: number;
}

/**
 * Task progress information
 */
export interface TaskProgress {
  taskId: string;
  status: TaskStatus;
  attempts: number;
  maxAttempts: number;
  error?: string;
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
}
