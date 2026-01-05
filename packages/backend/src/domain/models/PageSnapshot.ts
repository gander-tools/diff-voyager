import {
  type PageSnapshot,
  type SeoData,
  type PerformanceData,
  type ArtifactReferences,
  type Redirect,
  PageStatus,
} from '@gander-tools/diff-voyager-shared';
import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';

/**
 * Input parameters for creating a new page snapshot
 */
export interface CreatePageSnapshotInput {
  pageId: string;
  runId: string;
  html: string;
  httpStatus: number;
  httpHeaders: Record<string, string>;
  redirectChain?: Redirect[];
  seoData?: Partial<SeoData>;
  performance?: PerformanceData;
  artifacts?: Partial<ArtifactReferences>;
  error?: string;
}

/**
 * PageSnapshotModel - Domain model for managing page snapshots
 *
 * Encapsulates business logic for:
 * - Capturing page state (HTML, headers, SEO, performance)
 * - Computing HTML content hash for comparison
 * - Determining snapshot status based on capture results
 * - Managing artifact references
 */
export class PageSnapshotModel {
  /**
   * Create a new page snapshot
   */
  static create(input: CreatePageSnapshotInput): PageSnapshot {
    const htmlHash = this.computeHash(input.html);
    const status = this.determineStatus(input.httpStatus, input.error);

    const snapshot: PageSnapshot = {
      id: randomUUID(),
      pageId: input.pageId,
      runId: input.runId,
      status,
      capturedAt: new Date(),
      httpStatus: input.httpStatus,
      redirectChain: input.redirectChain,
      html: input.html,
      htmlHash,
      httpHeaders: input.httpHeaders,
      seoData: input.seoData ?? {},
      performance: input.performance,
      artifacts: input.artifacts ?? {},
      error: input.error,
    };

    return snapshot;
  }

  /**
   * Check if two snapshots have the same content (based on HTML hash)
   */
  static isSameContent(snapshot1: PageSnapshot, snapshot2: PageSnapshot): boolean {
    return snapshot1.htmlHash === snapshot2.htmlHash;
  }

  /**
   * Serialize snapshot to JSON
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
   * Deserialize snapshot from JSON
   */
  static fromJSON(json: Record<string, unknown>): PageSnapshot {
    return {
      id: json.id as string,
      pageId: json.pageId as string,
      runId: json.runId as string,
      status: json.status as PageStatus,
      capturedAt: new Date(json.capturedAt as string),
      httpStatus: json.httpStatus as number,
      redirectChain: json.redirectChain as Redirect[] | undefined,
      html: json.html as string,
      htmlHash: json.htmlHash as string,
      httpHeaders: json.httpHeaders as Record<string, string>,
      seoData: json.seoData as SeoData,
      performance: json.performance as PerformanceData | undefined,
      artifacts: json.artifacts as ArtifactReferences,
      error: json.error as string | undefined,
    };
  }

  /**
   * Compute SHA-256 hash of HTML content
   */
  private static computeHash(html: string): string {
    return createHash('sha256').update(html).digest('hex');
  }

  /**
   * Determine snapshot status based on HTTP status and error
   */
  private static determineStatus(httpStatus: number, error?: string): PageStatus {
    if (error) {
      return PageStatus.ERROR;
    }

    if (httpStatus >= 400) {
      return PageStatus.PARTIAL;
    }

    if (httpStatus >= 200 && httpStatus < 400) {
      return PageStatus.COMPLETED;
    }

    return PageStatus.ERROR;
  }
}
