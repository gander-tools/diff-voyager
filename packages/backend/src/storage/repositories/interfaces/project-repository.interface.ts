/**
 * Project Repository Interface
 * Defines the contract for ProjectRepository implementations
 */

import type { RunStatus } from '@gander-tools/diff-voyager-shared';
import type { CreateProjectInput, ProjectEntity } from '../project-repository.js';

/**
 * Interface for Project repository operations
 * Implemented by both SQL and Drizzle versions during migration
 */
export interface IProjectRepository {
  /**
   * Create a new project record
   */
  create(input: CreateProjectInput): Promise<ProjectEntity>;

  /**
   * Find a project by ID
   */
  findById(id: string): Promise<ProjectEntity | null>;

  /**
   * Find all projects with pagination
   */
  findAll(options?: { limit?: number; offset?: number }): Promise<{
    projects: ProjectEntity[];
    total: number;
  }>;

  /**
   * Update project status
   */
  updateStatus(id: string, status: RunStatus): Promise<void>;

  /**
   * Delete a project by ID
   * Cascade delete should remove all related pages, runs, and snapshots
   */
  delete(id: string): Promise<boolean>;
}
