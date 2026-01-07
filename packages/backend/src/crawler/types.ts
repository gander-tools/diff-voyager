/**
 * Crawler types and interfaces
 */

/**
 * Configuration for browser manager
 */
export interface BrowserManagerConfig {
  headless?: boolean;
  maxBrowsers?: number;
}

/**
 * Configuration for page processor
 */
export interface PageProcessorConfig {
  artifactsDir: string;
  viewport?: {
    width: number;
    height: number;
  };
  waitAfterLoad?: number;
  collectHar?: boolean;
}

/**
 * Configuration for site crawler
 */
export interface SiteCrawlerConfig {
  baseUrl: string;
  maxPages?: number;
  concurrency?: number;
  includePatterns?: string[];
  excludePatterns?: string[];
  stayInDomain?: boolean;
  followSubdomains?: boolean;
}

/**
 * Progress callback for crawler
 */
export interface CrawlProgress {
  discoveredUrls: number;
  processedUrls: number;
  failedUrls: number;
  currentUrl?: string;
}

/**
 * Result of a crawl operation
 */
export interface CrawlResult {
  totalPages: number;
  successfulPages: number;
  failedPages: number;
  processedUrls: string[];
  failedUrls: Array<{ url: string; error: string }>;
}

/**
 * Input for processing a single page
 */
export interface ProcessPageInput {
  url: string;
  projectId: string;
  runId: string;
  isBaseline: boolean;
  viewport?: { width: number; height: number };
  waitAfterLoad?: number;
  collectHar?: boolean;
}

/**
 * Result of processing a single page
 */
export interface ProcessPageResult {
  pageId: string;
  snapshotId: string;
  success: boolean;
  error?: string;
}
