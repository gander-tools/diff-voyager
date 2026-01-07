/**
 * API Request types for Diff Voyager
 */

import type { RunProfile } from '../enums/index.js';
import type { ViewportConfig } from './index.js';

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

  /**
   * Synchronous mode - block until complete and return full result
   * - false (default): return immediately with projectId
   * - true: block until complete
   */
  sync?: boolean;

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
 * Query parameters for GET /projects/:projectId
 */
export interface GetProjectQuery {
  /** Include pages in response */
  includePages?: boolean;

  /** Include diffs for changed pages */
  includeDiffs?: boolean;

  /** Show only pages with changes */
  changedOnly?: boolean;

  /** Filter by diff type */
  diffType?: string;

  /** Filter by severity */
  severity?: string;

  /** Max pages to include */
  pageLimit?: number;

  /** Offset for pagination */
  pageOffset?: number;
}
