/**
 * PageRepositoryDrizzle - Drizzle ORM implementation
 * Type-safe page repository using Drizzle query builder
 */

import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { DrizzleDb } from '../drizzle/db.js';
import { pages } from '../drizzle/schema/index.js';
import type { IPageRepository } from './interfaces/page-repository.interface.js';
import type { CreatePageInput, PageEntity } from './page-repository.js';

/**
 * Drizzle-based implementation of PageRepository
 * Provides type-safe database queries with automatic prepared statements
 */
export class PageRepositoryDrizzle implements IPageRepository {
  constructor(private db: DrizzleDb) {}

  async create(input: CreatePageInput): Promise<PageEntity> {
    const id = randomUUID();
    const now = new Date().toISOString();

    await this.db.insert(pages).values({
      id,
      projectId: input.projectId,
      normalizedUrl: input.normalizedUrl,
      originalUrl: input.originalUrl,
      createdAt: now,
    });

    return {
      id,
      projectId: input.projectId,
      normalizedUrl: input.normalizedUrl,
      originalUrl: input.originalUrl,
      createdAt: new Date(now),
    };
  }

  async findById(id: string): Promise<PageEntity | null> {
    const rows = await this.db.select().from(pages).where(eq(pages.id, id));

    if (rows.length === 0) {
      return null;
    }

    return this.rowToEntity(rows[0]);
  }

  async findByProjectId(projectId: string): Promise<PageEntity[]> {
    const rows = await this.db.select().from(pages).where(eq(pages.projectId, projectId));

    return rows.map((row) => this.rowToEntity(row));
  }

  async findByNormalizedUrl(projectId: string, normalizedUrl: string): Promise<PageEntity | null> {
    const rows = await this.db
      .select()
      .from(pages)
      .where(and(eq(pages.projectId, projectId), eq(pages.normalizedUrl, normalizedUrl)));

    if (rows.length === 0) {
      return null;
    }

    return this.rowToEntity(rows[0]);
  }

  async findOrCreate(input: CreatePageInput): Promise<PageEntity> {
    const existing = await this.findByNormalizedUrl(input.projectId, input.normalizedUrl);

    if (existing) {
      return existing;
    }

    return this.create(input);
  }

  /**
   * Convert database row to PageEntity
   * Handles date conversion from ISO string to Date object
   */
  private rowToEntity(row: typeof pages.$inferSelect): PageEntity {
    return {
      id: row.id,
      projectId: row.projectId,
      normalizedUrl: row.normalizedUrl,
      originalUrl: row.originalUrl,
      createdAt: new Date(row.createdAt),
    };
  }
}
