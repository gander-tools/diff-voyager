/**
 * Snapshot Repository Interface
 * Defines the contract for SnapshotRepository implementations
 */

import type {
  CreateSnapshotInput,
  SnapshotEntity,
  UpdateSnapshotInput,
} from '../snapshot-repository.js';

/**
 * Interface for Snapshot repository operations
 * Implemented by both SQL and Drizzle versions during migration
 */
export interface ISnapshotRepository {
  /**
   * Create a new snapshot record
   */
  create(input: CreateSnapshotInput): Promise<SnapshotEntity>;

  /**
   * Find a snapshot by ID
   */
  findById(id: string): Promise<SnapshotEntity | null>;

  /**
   * Find snapshot by page ID and run ID combination
   */
  findByPageAndRun(pageId: string, runId: string): Promise<SnapshotEntity | null>;

  /**
   * Find all snapshots for a run
   */
  findByRunId(runId: string): Promise<SnapshotEntity[]>;

  /**
   * Find all snapshots for a page
   */
  findByPageId(pageId: string): Promise<SnapshotEntity[]>;

  /**
   * Update a snapshot
   */
  update(id: string, input: UpdateSnapshotInput): Promise<void>;
}
