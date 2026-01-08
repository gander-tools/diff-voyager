/**
 * Snapshot repository for SQLite storage
 */

import { randomUUID } from 'node:crypto';
import { PageStatus, type PerformanceData, type SeoData } from '@gander-tools/diff-voyager-shared';
import type { Database } from 'better-sqlite3';
import type { SnapshotRow } from '../types.js';

export interface CreateSnapshotInput {
  id?: string;
  pageId: string;
  runId: string;
  isBaseline?: boolean;
  capturedAt?: Date;
  httpStatus?: number;
  redirectChain?: Array<{ url: string; status: number }>;
  htmlHash?: string;
  headers?: Record<string, string>;
  seo?: SeoData;
  performanceData?: PerformanceData;
  hasScreenshot?: boolean;
  hasHar?: boolean;
  hasDiff?: boolean;
}

export interface UpdateSnapshotInput {
  status: PageStatus;
  httpStatus?: number;
  redirectChain?: Array<{ url: string; status: number }>;
  htmlHash?: string;
  htmlPath?: string;
  headers?: Record<string, string>;
  seoData?: SeoData;
  performanceData?: PerformanceData;
  screenshotPath?: string;
  harPath?: string;
  diffImagePath?: string;
  capturedAt?: Date;
  errorMessage?: string;
}

export interface SnapshotEntity {
  id: string;
  pageId: string;
  runId: string;
  status: PageStatus;
  httpStatus?: number;
  redirectChain?: Array<{ url: string; status: number }>;
  htmlHash?: string;
  htmlPath?: string;
  headers?: Record<string, string>;
  seoData?: SeoData;
  performanceData?: PerformanceData;
  screenshotPath?: string;
  harPath?: string;
  diffImagePath?: string;
  capturedAt?: Date;
  errorMessage?: string;
}

export class SnapshotRepository {
  constructor(private db: Database) {}

  async create(input: CreateSnapshotInput): Promise<SnapshotEntity> {
    const id = input.id || randomUUID();
    const capturedAt = input.capturedAt || new Date();

    const stmt = this.db.prepare(`
      INSERT INTO snapshots (
        id, page_id, run_id, status, http_status,
        redirect_chain_json, html_hash, headers_json,
        seo_data_json, performance_data_json,
        screenshot_path, har_path, diff_image_path,
        captured_at, is_baseline
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      input.pageId,
      input.runId,
      PageStatus.PENDING,
      input.httpStatus || null,
      input.redirectChain ? JSON.stringify(input.redirectChain) : null,
      input.htmlHash || null,
      input.headers ? JSON.stringify(input.headers) : null,
      input.seo ? JSON.stringify(input.seo) : null,
      input.performanceData ? JSON.stringify(input.performanceData) : null,
      input.hasScreenshot ? 'screenshot.png' : null,
      input.hasHar ? 'performance.har' : null,
      input.hasDiff ? 'diff.png' : null,
      capturedAt.toISOString(),
      input.isBaseline ? 1 : 0,
    );

    return {
      id,
      pageId: input.pageId,
      runId: input.runId,
      status: PageStatus.PENDING,
      httpStatus: input.httpStatus,
      redirectChain: input.redirectChain,
      htmlHash: input.htmlHash,
      headers: input.headers,
      seoData: input.seo,
      performanceData: input.performanceData,
      screenshotPath: input.hasScreenshot ? 'screenshot.png' : undefined,
      harPath: input.hasHar ? 'performance.har' : undefined,
      diffImagePath: input.hasDiff ? 'diff.png' : undefined,
      capturedAt,
    };
  }

  async findById(id: string): Promise<SnapshotEntity | null> {
    const stmt = this.db.prepare('SELECT * FROM snapshots WHERE id = ?');
    const row = stmt.get(id) as SnapshotRow | undefined;
    if (!row) return null;
    return this.rowToEntity(row);
  }

  async findByPageAndRun(pageId: string, runId: string): Promise<SnapshotEntity | null> {
    const stmt = this.db.prepare('SELECT * FROM snapshots WHERE page_id = ? AND run_id = ?');
    const row = stmt.get(pageId, runId) as SnapshotRow | undefined;
    if (!row) return null;
    return this.rowToEntity(row);
  }

  async findByRunId(runId: string): Promise<SnapshotEntity[]> {
    const stmt = this.db.prepare('SELECT * FROM snapshots WHERE run_id = ?');
    const rows = stmt.all(runId) as SnapshotRow[];
    return rows.map((row) => this.rowToEntity(row));
  }

  async findByPageId(pageId: string): Promise<SnapshotEntity[]> {
    const stmt = this.db.prepare('SELECT * FROM snapshots WHERE page_id = ?');
    const rows = stmt.all(pageId) as SnapshotRow[];
    return rows.map((row) => this.rowToEntity(row));
  }

  async update(id: string, input: UpdateSnapshotInput): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE snapshots SET
        status = ?,
        http_status = ?,
        redirect_chain_json = ?,
        html_hash = ?,
        html_path = ?,
        headers_json = ?,
        seo_data_json = ?,
        performance_data_json = ?,
        screenshot_path = ?,
        har_path = ?,
        diff_image_path = ?,
        captured_at = ?,
        error_message = ?
      WHERE id = ?
    `);

    stmt.run(
      input.status,
      input.httpStatus || null,
      input.redirectChain ? JSON.stringify(input.redirectChain) : null,
      input.htmlHash || null,
      input.htmlPath || null,
      input.headers ? JSON.stringify(input.headers) : null,
      input.seoData ? JSON.stringify(input.seoData) : null,
      input.performanceData ? JSON.stringify(input.performanceData) : null,
      input.screenshotPath || null,
      input.harPath || null,
      input.diffImagePath || null,
      input.capturedAt?.toISOString() || null,
      input.errorMessage || null,
      id,
    );
  }

  private rowToEntity(row: SnapshotRow): SnapshotEntity {
    return {
      id: row.id,
      pageId: row.page_id,
      runId: row.run_id,
      status: row.status as PageStatus,
      httpStatus: row.http_status || undefined,
      redirectChain: row.redirect_chain_json ? JSON.parse(row.redirect_chain_json) : undefined,
      htmlHash: row.html_hash || undefined,
      htmlPath: row.html_path || undefined,
      headers: row.headers_json ? JSON.parse(row.headers_json) : undefined,
      seoData: row.seo_data_json ? JSON.parse(row.seo_data_json) : undefined,
      performanceData: row.performance_data_json
        ? JSON.parse(row.performance_data_json)
        : undefined,
      screenshotPath: row.screenshot_path || undefined,
      harPath: row.har_path || undefined,
      diffImagePath: row.diff_image_path || undefined,
      capturedAt: row.captured_at ? new Date(row.captured_at) : undefined,
      errorMessage: row.error_message || undefined,
    };
  }
}
