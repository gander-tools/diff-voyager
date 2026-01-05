import { randomUUID } from 'node:crypto';
import type { Baseline, ProjectConfig } from '../types/index.js';

/**
 * Domain model for Baseline with validation and business logic
 */
export class BaselineModel {
  /**
   * Creates a new baseline with validation
   */
  static create(data: {
    projectId: string;
    runId: string;
    pageCount: number;
    config: ProjectConfig;
  }): Baseline {
    // Validate projectId
    if (!data.projectId || data.projectId.trim().length === 0) {
      throw new Error('Project ID cannot be empty');
    }

    // Validate runId
    if (!data.runId || data.runId.trim().length === 0) {
      throw new Error('Run ID cannot be empty');
    }

    // Validate pageCount
    if (data.pageCount < 0) {
      throw new Error('Page count must be non-negative');
    }

    return {
      id: randomUUID(),
      projectId: data.projectId,
      runId: data.runId,
      pageCount: data.pageCount,
      createdAt: new Date(),
      config: data.config,
    };
  }

  /**
   * Serializes baseline to JSON-compatible format
   */
  static toJSON(baseline: Baseline): Record<string, unknown> {
    return {
      id: baseline.id,
      projectId: baseline.projectId,
      runId: baseline.runId,
      pageCount: baseline.pageCount,
      createdAt: baseline.createdAt.toISOString(),
      config: baseline.config,
    };
  }

  /**
   * Deserializes baseline from JSON
   */
  static fromJSON(data: {
    id: string;
    projectId: string;
    runId: string;
    pageCount: number;
    createdAt: string;
    config: ProjectConfig;
  }): Baseline {
    return {
      id: data.id,
      projectId: data.projectId,
      runId: data.runId,
      pageCount: data.pageCount,
      createdAt: new Date(data.createdAt),
      config: data.config,
    };
  }
}
