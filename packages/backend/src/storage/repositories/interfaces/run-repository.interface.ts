/**
 * Run Repository Interface
 * Defines the contract for RunRepository implementations
 */

import type { RunStatus } from '@gander-tools/diff-voyager-shared';
import type { CreateRunInput, RunEntity, RunStatistics } from '../run-repository.js';

/**
 * Interface for Run repository operations
 * Implemented by both SQL and Drizzle versions during migration
 */
export interface IRunRepository {
  /**
   * Create a new run record
   */
  create(input: CreateRunInput): Promise<RunEntity>;

  /**
   * Find a run by ID
   */
  findById(id: string): Promise<RunEntity | null>;

  /**
   * Find all runs for a project (ordered by created_at DESC)
   */
  findByProjectId(projectId: string): Promise<RunEntity[]>;

  /**
   * Update run status
   * - Sets started_at when status = IN_PROGRESS
   * - Sets completed_at when status = COMPLETED
   */
  updateStatus(id: string, status: RunStatus): Promise<void>;

  /**
   * Update run statistics
   */
  updateStatistics(id: string, statistics: RunStatistics): Promise<void>;
}
