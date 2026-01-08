/**
 * Page Repository Interface
 * Defines the contract for PageRepository implementations
 */

import type { CreatePageInput, PageEntity } from '../page-repository.js';

/**
 * Interface for Page repository operations
 * Implemented by both SQL and Drizzle versions during migration
 */
export interface IPageRepository {
  /**
   * Create a new page record
   */
  create(input: CreatePageInput): Promise<PageEntity>;

  /**
   * Find a page by ID
   */
  findById(id: string): Promise<PageEntity | null>;

  /**
   * Find all pages for a project
   */
  findByProjectId(projectId: string): Promise<PageEntity[]>;

  /**
   * Find a page by project ID and normalized URL
   */
  findByNormalizedUrl(projectId: string, normalizedUrl: string): Promise<PageEntity | null>;

  /**
   * Find existing page or create new one (upsert)
   */
  findOrCreate(input: CreatePageInput): Promise<PageEntity>;
}
