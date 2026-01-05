import type {
  PageSnapshot,
  PageStatus,
  SeoData,
  PerformanceData,
} from '@gander-tools/diff-voyager-shared';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface CreatePageSnapshotParams {
  pageId: string;
  runId: string;
  html: string;
  httpStatus: number;
  httpHeaders?: Record<string, string>;
  redirectChain?: string[];
  seoData?: SeoData;
  performance?: PerformanceData;
}

export class PageSnapshotModel implements PageSnapshot {
  id: string;
  pageId: string;
  runId: string;
  status: PageStatus;
  capturedAt: Date;
  httpStatus: number;
  redirectChain: string[];
  html: string;
  htmlHash: string;
  httpHeaders: Record<string, string>;
  seoData?: SeoData;
  performance?: PerformanceData;
  artifacts?: {
    screenshotPath?: string;
    harPath?: string;
    diffImagePath?: string;
  };

  constructor(data: PageSnapshot) {
    this.id = data.id;
    this.pageId = data.pageId;
    this.runId = data.runId;
    this.status = data.status;
    this.capturedAt = data.capturedAt;
    this.httpStatus = data.httpStatus;
    this.redirectChain = data.redirectChain;
    this.html = data.html;
    this.htmlHash = data.htmlHash;
    this.httpHeaders = data.httpHeaders;
    this.seoData = data.seoData;
    this.performance = data.performance;
    this.artifacts = data.artifacts;
  }

  /**
   * Creates a new page snapshot
   */
  static create(params: CreatePageSnapshotParams): PageSnapshotModel {
    const htmlHash = PageSnapshotModel.calculateHash(params.html);

    const snapshot: PageSnapshot = {
      id: PageSnapshotModel.generateId(),
      pageId: params.pageId,
      runId: params.runId,
      status: 'pending',
      capturedAt: new Date(),
      httpStatus: params.httpStatus,
      redirectChain: params.redirectChain || [],
      html: params.html,
      htmlHash,
      httpHeaders: params.httpHeaders || {},
      seoData: params.seoData,
      performance: params.performance,
    };

    return new PageSnapshotModel(snapshot);
  }

  /**
   * Generates a unique ID for a new snapshot
   */
  private static generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `snapshot-${timestamp}-${random}`;
  }

  /**
   * Calculates a simple hash of HTML content
   * In production, this should use a proper hashing algorithm like SHA-256
   */
  private static calculateHash(html: string): string {
    // Simple hash function for testing
    // In production, use crypto.subtle.digest('SHA-256', ...)
    let hash = 0;
    for (let i = 0; i < html.length; i++) {
      const char = html.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Validates the snapshot data
   */
  validate(): ValidationResult {
    const errors: string[] = [];

    // Validate pageId
    if (!this.pageId || this.pageId.trim().length === 0) {
      errors.push('Page ID is required');
    }

    // Validate runId
    if (!this.runId || this.runId.trim().length === 0) {
      errors.push('Run ID is required');
    }

    // Validate htmlHash
    if (!this.htmlHash || this.htmlHash.trim().length === 0) {
      errors.push('HTML hash is required');
    }

    // Validate httpStatus
    if (this.httpStatus < 100 || this.httpStatus > 599) {
      errors.push('HTTP status must be between 100 and 599');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Updates the snapshot status
   */
  updateStatus(status: PageStatus): PageSnapshotModel {
    const updated: PageSnapshot = {
      ...this.toJSON(),
      status,
    };

    return new PageSnapshotModel(updated);
  }

  /**
   * Checks if the snapshot is pending
   */
  isPending(): boolean {
    return this.status === 'pending';
  }

  /**
   * Checks if the snapshot is in progress
   */
  isInProgress(): boolean {
    return this.status === 'in_progress';
  }

  /**
   * Checks if the snapshot is completed
   */
  isCompleted(): boolean {
    return this.status === 'completed';
  }

  /**
   * Checks if the snapshot has an error
   */
  hasError(): boolean {
    return this.status === 'error';
  }

  /**
   * Checks if HTTP status is success (2xx)
   */
  isSuccess(): boolean {
    return this.httpStatus >= 200 && this.httpStatus < 300;
  }

  /**
   * Checks if HTTP status is redirect (3xx)
   */
  isRedirect(): boolean {
    return this.httpStatus >= 300 && this.httpStatus < 400;
  }

  /**
   * Checks if HTTP status is client error (4xx)
   */
  isClientError(): boolean {
    return this.httpStatus >= 400 && this.httpStatus < 500;
  }

  /**
   * Checks if HTTP status is server error (5xx)
   */
  isServerError(): boolean {
    return this.httpStatus >= 500 && this.httpStatus < 600;
  }

  /**
   * Checks if the page has redirects
   */
  hasRedirects(): boolean {
    return this.redirectChain.length > 0;
  }

  /**
   * Gets the number of redirects
   */
  getRedirectCount(): number {
    return this.redirectChain.length;
  }

  /**
   * Gets the SEO title
   */
  getSeoTitle(): string | null {
    return this.seoData?.title || null;
  }

  /**
   * Gets the meta description
   */
  getMetaDescription(): string | null {
    return this.seoData?.metaDescription || null;
  }

  /**
   * Gets the canonical URL
   */
  getCanonicalUrl(): string | null {
    return this.seoData?.canonical || null;
  }

  /**
   * Checks if the page is indexable
   */
  isIndexable(): boolean {
    const robots = this.seoData?.robots?.toLowerCase() || '';
    return !robots.includes('noindex');
  }

  /**
   * Gets H1 headings
   */
  getH1(): string[] {
    return this.seoData?.h1 || [];
  }

  /**
   * Checks if the snapshot has SEO data
   */
  hasSeoData(): boolean {
    return this.seoData !== undefined;
  }

  /**
   * Gets the load time in milliseconds
   */
  getLoadTime(): number | null {
    return this.performance?.loadTimeMs || null;
  }

  /**
   * Gets the request count
   */
  getRequestCount(): number | null {
    return this.performance?.requestCount || null;
  }

  /**
   * Gets the total size in bytes
   */
  getTotalSize(): number | null {
    return this.performance?.totalSizeBytes || null;
  }

  /**
   * Gets the total size in kilobytes
   */
  getTotalSizeKB(): number | null {
    const bytes = this.getTotalSize();
    return bytes !== null ? Math.round(bytes / 1024) : null;
  }

  /**
   * Gets the total size in megabytes
   */
  getTotalSizeMB(): number | null {
    const bytes = this.getTotalSize();
    return bytes !== null ? Math.round((bytes / 1024 / 1024) * 10) / 10 : null;
  }

  /**
   * Checks if the snapshot has performance data
   */
  hasPerformanceData(): boolean {
    return this.performance !== undefined;
  }

  /**
   * Checks if the snapshot has a screenshot
   */
  hasScreenshot(): boolean {
    return !!this.artifacts?.screenshotPath;
  }

  /**
   * Checks if the snapshot has a HAR file
   */
  hasHar(): boolean {
    return !!this.artifacts?.harPath;
  }

  /**
   * Gets the screenshot path
   */
  getScreenshotPath(): string | null {
    return this.artifacts?.screenshotPath || null;
  }

  /**
   * Gets the HAR file path
   */
  getHarPath(): string | null {
    return this.artifacts?.harPath || null;
  }

  /**
   * Gets the HTML content
   */
  getHtml(): string {
    return this.html;
  }

  /**
   * Gets the HTML hash
   */
  getHtmlHash(): string {
    return this.htmlHash;
  }

  /**
   * Checks if HTML has changed compared to another snapshot
   */
  hasHtmlChanged(other: PageSnapshotModel): boolean {
    return this.htmlHash !== other.htmlHash;
  }

  /**
   * Serializes the snapshot to JSON
   */
  toJSON(): PageSnapshot {
    return {
      id: this.id,
      pageId: this.pageId,
      runId: this.runId,
      status: this.status,
      capturedAt: this.capturedAt,
      httpStatus: this.httpStatus,
      redirectChain: this.redirectChain,
      html: this.html,
      htmlHash: this.htmlHash,
      httpHeaders: this.httpHeaders,
      seoData: this.seoData,
      performance: this.performance,
      artifacts: this.artifacts,
    };
  }

  /**
   * Creates a deep copy of the snapshot
   */
  clone(): PageSnapshotModel {
    const cloned: PageSnapshot = {
      id: this.id,
      pageId: this.pageId,
      runId: this.runId,
      status: this.status,
      capturedAt: new Date(this.capturedAt),
      httpStatus: this.httpStatus,
      redirectChain: [...this.redirectChain],
      html: this.html,
      htmlHash: this.htmlHash,
      httpHeaders: { ...this.httpHeaders },
      seoData: this.seoData ? JSON.parse(JSON.stringify(this.seoData)) : undefined,
      performance: this.performance
        ? JSON.parse(JSON.stringify(this.performance))
        : undefined,
      artifacts: this.artifacts
        ? JSON.parse(JSON.stringify(this.artifacts))
        : undefined,
    };

    return new PageSnapshotModel(cloned);
  }
}
