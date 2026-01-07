# Domain Types and Interfaces

## Existing Types (packages/shared)

The following types already exist in `packages/shared/src/types/index.ts` and will be reused:

- `Project`, `ProjectConfig`
- `Baseline`
- `Run`, `RunConfig`, `RunStatistics`
- `Page`
- `PageSnapshot`, `SeoData`, `PerformanceData`, `ArtifactReferences`
- `Diff`, `Change`, `DiffSummary`
- `MuteRule`, `RuleCondition`

Existing enums in `packages/shared/src/enums/index.ts`:
- `RunStatus`, `PageStatus`, `DiffType`, `DiffStatus`, `DiffSeverity`, `RuleScope`, `RunProfile`

## New Types for API Layer

### Task Queue Types

```typescript
// packages/shared/src/types/queue.ts

/**
 * Task status in the processing queue
 */
export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * Type of scan task
 */
export enum TaskType {
  SINGLE_PAGE = 'SINGLE_PAGE',
  FULL_CRAWL = 'FULL_CRAWL',
}

/**
 * Task in the processing queue
 */
export interface Task {
  id: string;
  projectId: string;
  runId: string;
  type: TaskType;
  status: TaskStatus;
  priority: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
}

/**
 * Individual page processing task within a run
 */
export interface PageTask {
  id: string;
  taskId: string;
  pageId: string;
  url: string;
  status: TaskStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  retryCount: number;
}
```

### API Request Types

```typescript
// packages/shared/src/types/api-requests.ts

/**
 * Viewport configuration for screenshots
 */
export interface ViewportConfig {
  width: number;
  height: number;
}

/**
 * Request to create a scan (Scenarios 1 & 2)
 * - crawl: false (default) = scan only the specified URL (Scenario 1)
 * - crawl: true = discover and crawl all pages in domain (Scenario 2)
 */
export interface CreateScanRequest {
  /** Starting URL for the scan */
  url: string;

  /**
   * Enable crawler to discover and scan all pages in domain
   * - false (default): scan only the specified URL
   * - true: crawl entire domain starting from URL
   */
  crawl?: boolean;

  /** Optional project name (auto-generated if not provided) */
  name?: string;

  /** Optional project description */
  description?: string;

  /** Run profile determining what data to collect */
  profile?: RunProfile;

  /** Viewport configuration for screenshots */
  viewport?: ViewportConfig;

  /** Visual diff threshold (0-1, percentage of pixels) */
  visualDiffThreshold?: number;

  /** Whether to collect HAR files */
  collectHar?: boolean;

  /** Wait time after page load (ms) */
  waitAfterLoad?: number;

  // --- Crawler options (only used when crawl: true) ---

  /** Maximum number of pages to crawl */
  maxPages?: number;

  /** Maximum crawl duration in seconds */
  maxDurationSeconds?: number;

  /** URL patterns to include (regex) */
  includePatterns?: string[];

  /** URL patterns to exclude (regex) */
  excludePatterns?: string[];

  /** Whether to follow subdomains */
  followSubdomains?: boolean;

  /** Concurrent page processing limit */
  concurrency?: number;
}

/**
 * Request to create a comparison run against baseline
 */
export interface CreateComparisonRunRequest {
  /** Project ID to run comparison for */
  projectId: string;

  /** Optional run profile override */
  profile?: RunProfile;

  /** Optional viewport override */
  viewport?: ViewportConfig;
}

/**
 * Query parameters for listing pages
 */
export interface ListPagesQuery {
  /** Filter by page status */
  status?: PageStatus;

  /** Filter pages with changes only */
  changedOnly?: boolean;

  /** Filter by diff type */
  diffType?: DiffType;

  /** Filter by diff severity */
  severity?: DiffSeverity;

  /** Include muted diffs in results */
  includeMuted?: boolean;

  /** Page number (1-indexed) */
  page?: number;

  /** Items per page */
  limit?: number;

  /** Sort field */
  sortBy?: 'url' | 'status' | 'changesCount' | 'capturedAt';

  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Query parameters for listing diffs
 */
export interface ListDiffsQuery {
  /** Filter by diff type */
  type?: DiffType;

  /** Filter by diff status */
  status?: DiffStatus;

  /** Filter by severity */
  severity?: DiffSeverity;

  /** Include muted diffs */
  includeMuted?: boolean;
}
```

### API Response Types

```typescript
// packages/shared/src/types/api-responses.ts

/**
 * Standard API error response
 */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Response after creating a scan task
 */
export interface CreateScanResponse {
  /** Unique task identifier */
  taskId: string;

  /** Project identifier */
  projectId: string;

  /** Run identifier */
  runId: string;

  /** Current task status */
  status: TaskStatus;

  /** URL to poll for status updates */
  statusUrl: string;

  /** URL to get full project details */
  projectUrl: string;
}

/**
 * Task status response
 */
export interface TaskStatusResponse {
  taskId: string;
  projectId: string;
  runId: string;
  type: TaskType;
  status: TaskStatus;
  progress: {
    totalPages: number;
    completedPages: number;
    failedPages: number;
    currentPage?: string;
  };
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  estimatedTimeRemaining?: number;
  errorMessage?: string;
}

/**
 * Paginated list response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Project summary for list view
 */
export interface ProjectSummary {
  id: string;
  name: string;
  description?: string;
  baseUrl: string;
  status: RunStatus;
  createdAt: string;
  lastRunAt?: string;
  pageCount: number;
  hasBaseline: boolean;
}

/**
 * Full project details response
 */
export interface ProjectDetailsResponse {
  project: Project;
  baseline?: Baseline;
  latestRun?: Run;
  runs: RunSummary[];
  statistics: ProjectStatistics;
}

/**
 * Project-level statistics
 */
export interface ProjectStatistics {
  totalRuns: number;
  totalPages: number;
  lastRunAt?: string;
  totalDifferences: number;
  criticalDifferences: number;
  acceptedDifferences: number;
  mutedDifferences: number;
}

/**
 * Run summary for list view
 */
export interface RunSummary {
  id: string;
  projectId: string;
  status: RunStatus;
  isBaseline: boolean;
  createdAt: string;
  completedAt?: string;
  statistics: RunStatistics;
}

/**
 * Full run details response
 */
export interface RunDetailsResponse {
  run: Run;
  project: ProjectSummary;
  pages: PageSummary[];
  statistics: RunStatistics;
}

/**
 * Page summary for list view
 */
export interface PageSummary {
  id: string;
  normalizedUrl: string;
  originalUrl: string;
  status: PageStatus;
  httpStatus?: number;
  hasChanges: boolean;
  changeCount: number;
  criticalChangeCount: number;
  capturedAt?: string;
}

/**
 * Full page details response
 */
export interface PageDetailsResponse {
  page: Page;
  snapshot: PageSnapshot;
  baselineSnapshot?: PageSnapshot;
  diff?: DiffDetailsResponse;
}

/**
 * Diff details response with full change information
 */
export interface DiffDetailsResponse {
  id: string;
  pageId: string;
  runId: string;
  summary: DiffSummary;
  seoChanges: SeoChange[];
  headerChanges: HeaderChange[];
  contentChanges: ContentChange[];
  visualDiff?: VisualDiffInfo;
  performanceChanges?: PerformanceChange[];
}

/**
 * SEO-specific change detail
 */
export interface SeoChange {
  field: 'title' | 'metaDescription' | 'canonical' | 'robots' | 'h1' | 'h2' | 'lang' | 'openGraph' | 'twitterCard';
  severity: DiffSeverity;
  status: DiffStatus;
  baselineValue: string | null;
  currentValue: string | null;
}

/**
 * HTTP header change detail
 */
export interface HeaderChange {
  headerName: string;
  severity: DiffSeverity;
  status: DiffStatus;
  baselineValue: string | null;
  currentValue: string | null;
}

/**
 * Content change detail
 */
export interface ContentChange {
  type: 'text' | 'structure' | 'attribute';
  selector?: string;
  severity: DiffSeverity;
  status: DiffStatus;
  description: string;
  baselineValue?: string;
  currentValue?: string;
}

/**
 * Visual diff information
 */
export interface VisualDiffInfo {
  diffPixels: number;
  diffPercentage: number;
  thresholdExceeded: boolean;
  threshold: number;
  baselineScreenshotUrl: string;
  currentScreenshotUrl: string;
  diffImageUrl: string;
}

/**
 * Performance change detail
 */
export interface PerformanceChange {
  metric: 'loadTime' | 'requestCount' | 'totalSize';
  severity: DiffSeverity;
  status: DiffStatus;
  baselineValue: number;
  currentValue: number;
  changePercentage: number;
}

/**
 * Artifact info for binary retrieval
 */
export interface ArtifactInfo {
  id: string;
  type: 'screenshot' | 'diff' | 'har';
  pageId: string;
  runId: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}
```

### Storage Layer Types

```typescript
// packages/backend/src/storage/types.ts

/**
 * Storage configuration
 */
export interface StorageConfig {
  /** Base directory for all storage */
  baseDir: string;

  /** SQLite database path */
  dbPath: string;

  /** Artifacts directory path */
  artifactsDir: string;
}

/**
 * Artifact storage paths
 */
export interface ArtifactPaths {
  projectDir: string;
  runDir: string;
  screenshotsDir: string;
  diffsDir: string;
  harsDir: string;
  htmlDir: string;
}

/**
 * Database schema for projects table
 */
export interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  base_url: string;
  config_json: string;
  created_at: string;
  updated_at: string;
}

/**
 * Database schema for runs table
 */
export interface RunRow {
  id: string;
  project_id: string;
  is_baseline: number;
  status: string;
  config_json: string;
  statistics_json: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  interrupted_at: string | null;
}

/**
 * Database schema for pages table
 */
export interface PageRow {
  id: string;
  project_id: string;
  normalized_url: string;
  original_url: string;
  created_at: string;
}

/**
 * Database schema for snapshots table
 */
export interface SnapshotRow {
  id: string;
  page_id: string;
  run_id: string;
  status: string;
  http_status: number | null;
  redirect_chain_json: string | null;
  html_hash: string | null;
  html_path: string | null;
  headers_json: string | null;
  seo_data_json: string | null;
  performance_data_json: string | null;
  screenshot_path: string | null;
  har_path: string | null;
  diff_image_path: string | null;
  captured_at: string | null;
  error_message: string | null;
}

/**
 * Database schema for diffs table
 */
export interface DiffRow {
  id: string;
  page_id: string;
  run_id: string;
  baseline_snapshot_id: string;
  run_snapshot_id: string;
  summary_json: string;
  changes_json: string;
  created_at: string;
}

/**
 * Database schema for tasks table
 */
export interface TaskRow {
  id: string;
  project_id: string;
  run_id: string;
  type: string;
  status: string;
  priority: number;
  retry_count: number;
  max_retries: number;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
}

/**
 * Database schema for page_tasks table
 */
export interface PageTaskRow {
  id: string;
  task_id: string;
  page_id: string | null;
  url: string;
  status: string;
  retry_count: number;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}
```

### Crawler Types

```typescript
// packages/backend/src/crawler/types.ts

/**
 * Page capture result from Playwright
 */
export interface PageCaptureResult {
  url: string;
  normalizedUrl: string;
  httpStatus: number;
  redirectChain: RedirectInfo[];
  html: string;
  htmlHash: string;
  headers: Record<string, string>;
  seoData: SeoData;
  screenshotBuffer: Buffer;
  harData?: HarData;
  performanceData?: PerformanceData;
  capturedAt: string;
  error?: string;
}

/**
 * Redirect information
 */
export interface RedirectInfo {
  url: string;
  status: number;
}

/**
 * HAR format data (simplified)
 */
export interface HarData {
  log: {
    version: string;
    creator: { name: string; version: string };
    entries: HarEntry[];
  };
}

/**
 * HAR entry (simplified)
 */
export interface HarEntry {
  startedDateTime: string;
  time: number;
  request: {
    method: string;
    url: string;
    httpVersion: string;
    headers: { name: string; value: string }[];
  };
  response: {
    status: number;
    statusText: string;
    httpVersion: string;
    headers: { name: string; value: string }[];
    content: { size: number; mimeType: string };
  };
  timings: {
    blocked: number;
    dns: number;
    connect: number;
    send: number;
    wait: number;
    receive: number;
  };
}

/**
 * Crawler event callbacks
 */
export interface CrawlerCallbacks {
  onPageStart?: (url: string) => void;
  onPageComplete?: (result: PageCaptureResult) => void;
  onPageError?: (url: string, error: Error) => void;
  onProgress?: (completed: number, total: number) => void;
  onComplete?: () => void;
}

/**
 * Crawler options
 */
export interface CrawlerOptions {
  baseUrl: string;
  viewport: ViewportConfig;
  maxPages?: number;
  maxDurationSeconds?: number;
  includePatterns?: RegExp[];
  excludePatterns?: RegExp[];
  followSubdomains?: boolean;
  waitAfterLoad?: number;
  concurrency?: number;
  collectHar?: boolean;
  userAgent?: string;
}
```

### Comparison Types

```typescript
// packages/backend/src/comparison/types.ts

/**
 * Comparison options
 */
export interface ComparisonOptions {
  /** Visual diff threshold (0-1) */
  visualThreshold: number;

  /** Performance change threshold (percentage) */
  performanceThreshold: number;

  /** CSS selectors to ignore */
  ignoreSelectors?: string[];

  /** XPath expressions to ignore */
  ignoreXPaths?: string[];

  /** Headers to ignore */
  ignoreHeaders?: string[];

  /** Fields to anonymize */
  anonymizeFields?: string[];
}

/**
 * Visual comparison result
 */
export interface VisualComparisonResult {
  diffPixels: number;
  diffPercentage: number;
  thresholdExceeded: boolean;
  diffImageBuffer?: Buffer;
}

/**
 * SEO comparison result
 */
export interface SeoComparisonResult {
  changes: SeoChange[];
  hasCriticalChanges: boolean;
}

/**
 * Header comparison result
 */
export interface HeaderComparisonResult {
  changes: HeaderChange[];
  hasCriticalChanges: boolean;
}

/**
 * Content comparison result
 */
export interface ContentComparisonResult {
  changes: ContentChange[];
  hasCriticalChanges: boolean;
}

/**
 * Performance comparison result
 */
export interface PerformanceComparisonResult {
  changes: PerformanceChange[];
  hasCriticalChanges: boolean;
}

/**
 * Full comparison result for a page
 */
export interface PageComparisonResult {
  pageId: string;
  visual: VisualComparisonResult;
  seo: SeoComparisonResult;
  headers: HeaderComparisonResult;
  content: ContentComparisonResult;
  performance?: PerformanceComparisonResult;
  summary: DiffSummary;
}
```

## Type Placement Summary

| Types | Location |
|-------|----------|
| Domain models (Project, Run, Page, etc.) | `packages/shared/src/types/index.ts` (existing) |
| Enums (RunStatus, DiffType, etc.) | `packages/shared/src/enums/index.ts` (existing) |
| Task/Queue types | `packages/shared/src/types/queue.ts` (new) |
| API request types | `packages/shared/src/types/api-requests.ts` (new) |
| API response types | `packages/shared/src/types/api-responses.ts` (new) |
| Storage layer types | `packages/backend/src/storage/types.ts` (new) |
| Crawler types | `packages/backend/src/crawler/types.ts` (new) |
| Comparison types | `packages/backend/src/comparison/types.ts` (new) |

## Constants and Defaults

```typescript
// packages/shared/src/constants.ts

export const DEFAULT_VIEWPORT = { width: 1920, height: 1080 };
export const DEFAULT_VISUAL_THRESHOLD = 0.01; // 1% pixel difference
export const DEFAULT_PERFORMANCE_THRESHOLD = 0.20; // 20% change
export const DEFAULT_MAX_PAGES = 1000;
export const DEFAULT_MAX_DURATION_SECONDS = 3600; // 1 hour
export const DEFAULT_WAIT_AFTER_LOAD = 1000; // 1 second
export const DEFAULT_CONCURRENCY = 3;
export const DEFAULT_MAX_RETRIES = 3;
export const DEFAULT_PAGE_LIMIT = 50;
```
