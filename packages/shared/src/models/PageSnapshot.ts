import { createHash, randomUUID } from 'node:crypto';
import type {
  PageSnapshot,
  SeoData,
  PerformanceData,
  ArtifactReferences,
  Redirect,
} from '../types/index.js';
import { PageStatus } from '../enums/index.js';

/**
 * Domain model for PageSnapshot with validation and business logic
 */
export class PageSnapshotModel {
  /**
   * Creates a new page snapshot with validation
   */
  static create(data: {
    pageId: string;
    runId: string;
    httpStatus: number;
    html: string;
    httpHeaders: Record<string, string>;
    seoData: SeoData;
    status?: PageStatus;
    redirectChain?: Redirect[];
    performance?: PerformanceData;
    artifacts?: ArtifactReferences;
    error?: string;
  }): PageSnapshot {
    // Validate pageId
    if (!data.pageId || data.pageId.trim().length === 0) {
      throw new Error('Page ID cannot be empty');
    }

    // Validate runId
    if (!data.runId || data.runId.trim().length === 0) {
      throw new Error('Run ID cannot be empty');
    }

    // Validate HTTP status
    if (data.httpStatus < 100 || data.httpStatus > 599) {
      throw new Error('HTTP status must be between 100 and 599');
    }

    // Generate HTML hash
    const htmlHash = this.generateHash(data.html);

    return {
      id: randomUUID(),
      pageId: data.pageId,
      runId: data.runId,
      status: data.status ?? PageStatus.COMPLETED,
      capturedAt: new Date(),
      httpStatus: data.httpStatus,
      redirectChain: data.redirectChain,
      html: data.html,
      htmlHash,
      httpHeaders: data.httpHeaders,
      seoData: data.seoData,
      performance: data.performance,
      artifacts: data.artifacts ?? {},
      error: data.error,
    };
  }

  /**
   * Generates SHA-256 hash of HTML content
   */
  static generateHash(html: string): string {
    return createHash('sha256').update(html).digest('hex');
  }

  /**
   * Serializes page snapshot to JSON-compatible format
   */
  static toJSON(snapshot: PageSnapshot): Record<string, unknown> {
    return {
      id: snapshot.id,
      pageId: snapshot.pageId,
      runId: snapshot.runId,
      status: snapshot.status,
      capturedAt: snapshot.capturedAt.toISOString(),
      httpStatus: snapshot.httpStatus,
      redirectChain: snapshot.redirectChain,
      html: snapshot.html,
      htmlHash: snapshot.htmlHash,
      httpHeaders: snapshot.httpHeaders,
      seoData: snapshot.seoData,
      performance: snapshot.performance,
      artifacts: snapshot.artifacts,
      error: snapshot.error,
    };
  }

  /**
   * Deserializes page snapshot from JSON
   */
  static fromJSON(data: {
    id: string;
    pageId: string;
    runId: string;
    status: PageStatus;
    capturedAt: string;
    httpStatus: number;
    redirectChain?: Redirect[];
    html: string;
    htmlHash: string;
    httpHeaders: Record<string, string>;
    seoData: SeoData;
    performance?: PerformanceData;
    artifacts: ArtifactReferences;
    error?: string;
  }): PageSnapshot {
    return {
      id: data.id,
      pageId: data.pageId,
      runId: data.runId,
      status: data.status,
      capturedAt: new Date(data.capturedAt),
      httpStatus: data.httpStatus,
      redirectChain: data.redirectChain,
      html: data.html,
      htmlHash: data.htmlHash,
      httpHeaders: data.httpHeaders,
      seoData: data.seoData,
      performance: data.performance,
      artifacts: data.artifacts,
      error: data.error,
    };
  }
}
