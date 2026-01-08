/**
 * Diff Repository Interface
 * Defines the contract for DiffRepository implementations
 */

import type { Diff } from '@gander-tools/diff-voyager-shared';
import type { CreateDiffInput } from '../diff-repository.js';

/**
 * Interface for Diff repository operations
 * Implemented by both SQL and Drizzle versions during migration
 */
export interface IDiffRepository {
  /**
   * Create a new diff record
   */
  create(input: CreateDiffInput): Promise<Diff>;

  /**
   * Find diff by page ID and run ID combination
   */
  findByPageAndRun(pageId: string, runId: string): Promise<Diff | null>;

  /**
   * Find all diffs for a run (ordered by created_at DESC)
   */
  findByRun(runId: string): Promise<Diff[]>;
}
