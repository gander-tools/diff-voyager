/**
 * API Response types for Diff Voyager
 */

import type { RunStatus, PageStatus, DiffSeverity } from '../enums/index.js';
import type { SeoData, PerformanceData, DiffSummary } from './index.js';

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
 * Async response after creating a scan (sync: false)
 */
export interface CreateScanAsyncResponse {
  projectId: string;
  status: 'PENDING';
  projectUrl: string;
}

/**
 * SEO change detail in diff
 */
export interface SeoChangeResponse {
  field: string;
  severity: DiffSeverity;
  baselineValue: string | null;
  currentValue: string | null;
}

/**
 * Header change detail in diff
 */
export interface HeaderChangeResponse {
  headerName: string;
  severity: DiffSeverity;
  baselineValue: string | null;
  currentValue: string | null;
}

/**
 * Performance change detail in diff
 */
export interface PerformanceChangeResponse {
  metric: string;
  severity: DiffSeverity;
  baselineValue: number;
  currentValue: number;
  changePercentage: number;
}

/**
 * Visual diff info in response
 */
export interface VisualDiffResponse {
  diffPercentage: number;
  diffPixels: number;
  thresholdExceeded: boolean;
  baselineScreenshotUrl: string;
  diffImageUrl: string;
}

/**
 * Diff response nested in page
 */
export interface PageDiffResponse {
  summary: DiffSummary;
  seoChanges: SeoChangeResponse[];
  headerChanges: HeaderChangeResponse[];
  performanceChanges: PerformanceChangeResponse[];
  visualDiff?: VisualDiffResponse;
}

/**
 * Artifacts URLs for a page
 */
export interface PageArtifactsResponse {
  screenshotUrl?: string;
  diffImageUrl?: string;
  harUrl?: string;
  htmlUrl?: string;
}

/**
 * Page response in project details
 */
export interface PageResponse {
  id: string;
  url: string;
  originalUrl: string;
  status: PageStatus;
  httpStatus?: number;
  capturedAt?: string;
  seoData?: SeoData;
  httpHeaders?: Record<string, string>;
  performanceData?: PerformanceData;
  artifacts: PageArtifactsResponse;
  diff: PageDiffResponse | null;
}

/**
 * Project statistics
 */
export interface ProjectStatisticsResponse {
  totalPages: number;
  completedPages: number;
  errorPages: number;
  changedPages: number;
  unchangedPages: number;
  totalDifferences: number;
  criticalDifferences: number;
  acceptedDifferences: number;
  mutedDifferences: number;
}

/**
 * Pagination info
 */
export interface PaginationResponse {
  totalPages: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Project config in response
 */
export interface ProjectConfigResponse {
  crawl: boolean;
  viewport: { width: number; height: number };
  visualDiffThreshold: number;
  maxPages?: number;
}

/**
 * Full project details response (sync response or GET /projects/:id)
 */
export interface ProjectDetailsResponse {
  id: string;
  name: string;
  description?: string;
  baseUrl: string;
  config: ProjectConfigResponse;
  status: RunStatus;
  createdAt: string;
  updatedAt: string;
  statistics: ProjectStatisticsResponse;
  pages: PageResponse[];
  pagination: PaginationResponse;
}
