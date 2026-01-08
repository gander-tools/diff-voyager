/**
 * SnapshotRepositoryDrizzle - Drizzle ORM implementation
 * Type-safe snapshot repository with 4 JSON columns
 */

import { randomUUID } from 'node:crypto';
import { PageStatus } from '@gander-tools/diff-voyager-shared';
import { and, eq } from 'drizzle-orm';
import type { DrizzleDb } from '../drizzle/db.js';
import { snapshots } from '../drizzle/schema/index.js';
import type { ISnapshotRepository } from './interfaces/snapshot-repository.interface.js';
import type {
  CreateSnapshotInput,
  SnapshotEntity,
  UpdateSnapshotInput,
} from './snapshot-repository.js';

/**
 * Drizzle-based implementation of SnapshotRepository
 * Handles 4 JSON columns: redirectChain, headers, seoData, performanceData
 */
export class SnapshotRepositoryDrizzle implements ISnapshotRepository {
  constructor(private db: DrizzleDb) {}

  async create(input: CreateSnapshotInput): Promise<SnapshotEntity> {
    const id = input.id || randomUUID();

    await this.db.insert(snapshots).values({
      id,
      pageId: input.pageId,
      runId: input.runId,
      status: PageStatus.COMPLETED,
      httpStatus: input.httpStatus,
      redirectChainJson: input.redirectChain ? JSON.stringify(input.redirectChain) : null,
      htmlHash: input.htmlHash,
      htmlPath: null,
      headersJson: JSON.stringify(input.headers),
      seoDataJson: JSON.stringify(input.seo),
      performanceDataJson: input.performanceData ? JSON.stringify(input.performanceData) : null,
      screenshotPath: input.hasScreenshot ? 'screenshot.png' : null,
      harPath: input.hasHar ? 'performance.har' : null,
      diffImagePath: input.hasDiff ? 'diff.png' : null,
      capturedAt: input.capturedAt.toISOString(),
      errorMessage: null,
      isBaseline: input.isBaseline,
    });

    return {
      id,
      pageId: input.pageId,
      runId: input.runId,
      status: PageStatus.COMPLETED,
      httpStatus: input.httpStatus,
      redirectChain: input.redirectChain,
      htmlHash: input.htmlHash,
      headers: input.headers,
      seoData: input.seo,
      performanceData: input.performanceData,
      screenshotPath: input.hasScreenshot ? 'screenshot.png' : undefined,
      harPath: input.hasHar ? 'performance.har' : undefined,
      diffImagePath: input.hasDiff ? 'diff.png' : undefined,
      capturedAt: input.capturedAt,
    };
  }

  async findById(id: string): Promise<SnapshotEntity | null> {
    const rows = await this.db.select().from(snapshots).where(eq(snapshots.id, id)).all();

    if (rows.length === 0) {
      return null;
    }

    return this.rowToEntity(rows[0]);
  }

  async findByPageAndRun(pageId: string, runId: string): Promise<SnapshotEntity | null> {
    const rows = await this.db
      .select()
      .from(snapshots)
      .where(and(eq(snapshots.pageId, pageId), eq(snapshots.runId, runId)))
      .all();

    if (rows.length === 0) {
      return null;
    }

    return this.rowToEntity(rows[0]);
  }

  async findByRunId(runId: string): Promise<SnapshotEntity[]> {
    const rows = await this.db.select().from(snapshots).where(eq(snapshots.runId, runId)).all();

    return rows.map((row) => this.rowToEntity(row));
  }

  async findByPageId(pageId: string): Promise<SnapshotEntity[]> {
    const rows = await this.db.select().from(snapshots).where(eq(snapshots.pageId, pageId)).all();

    return rows.map((row) => this.rowToEntity(row));
  }

  async update(id: string, input: UpdateSnapshotInput): Promise<void> {
    // Build update object only with provided fields
    const updateData: Record<string, unknown> = {
      status: input.status,
    };

    if (input.httpStatus !== undefined) updateData.httpStatus = input.httpStatus || null;
    if (input.redirectChain !== undefined) {
      updateData.redirectChainJson = input.redirectChain
        ? JSON.stringify(input.redirectChain)
        : null;
    }
    if (input.htmlHash !== undefined) updateData.htmlHash = input.htmlHash || null;
    if (input.htmlPath !== undefined) updateData.htmlPath = input.htmlPath || null;
    if (input.headers !== undefined) {
      updateData.headersJson = input.headers ? JSON.stringify(input.headers) : null;
    }
    if (input.seoData !== undefined) {
      updateData.seoDataJson = input.seoData ? JSON.stringify(input.seoData) : null;
    }
    if (input.performanceData !== undefined) {
      updateData.performanceDataJson = input.performanceData
        ? JSON.stringify(input.performanceData)
        : null;
    }
    if (input.screenshotPath !== undefined)
      updateData.screenshotPath = input.screenshotPath || null;
    if (input.harPath !== undefined) updateData.harPath = input.harPath || null;
    if (input.diffImagePath !== undefined) updateData.diffImagePath = input.diffImagePath || null;
    if (input.capturedAt !== undefined)
      updateData.capturedAt = input.capturedAt?.toISOString() || null;
    if (input.errorMessage !== undefined) updateData.errorMessage = input.errorMessage || null;

    await this.db.update(snapshots).set(updateData).where(eq(snapshots.id, id));
  }

  /**
   * Convert database row to SnapshotEntity
   * Handles 4 JSON columns and optional fields
   */
  private rowToEntity(row: typeof snapshots.$inferSelect): SnapshotEntity {
    return {
      id: row.id,
      pageId: row.pageId,
      runId: row.runId,
      status: row.status as PageStatus,
      httpStatus: row.httpStatus ?? undefined,
      redirectChain: row.redirectChainJson ? JSON.parse(row.redirectChainJson) : undefined,
      htmlHash: row.htmlHash ?? undefined,
      htmlPath: row.htmlPath ?? undefined,
      headers: row.headersJson ? JSON.parse(row.headersJson) : undefined,
      seoData: row.seoDataJson ? JSON.parse(row.seoDataJson) : undefined,
      performanceData: row.performanceDataJson ? JSON.parse(row.performanceDataJson) : undefined,
      screenshotPath: row.screenshotPath ?? undefined,
      harPath: row.harPath ?? undefined,
      diffImagePath: row.diffImagePath ?? undefined,
      capturedAt: row.capturedAt ? new Date(row.capturedAt) : undefined,
      errorMessage: row.errorMessage ?? undefined,
    };
  }
}
