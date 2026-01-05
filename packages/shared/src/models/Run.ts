import { randomUUID } from 'node:crypto';
import type { Run, RunConfig, RunStatistics } from '../types/index.js';
import { RunStatus } from '../enums/index.js';

/**
 * Domain model for Run with validation and business logic
 */
export class RunModel {
  /**
   * Creates a new run with validation
   */
  static create(data: {
    projectId: string;
    baselineId: string;
    config: RunConfig;
  }): Run {
    // Validate projectId
    if (!data.projectId || data.projectId.trim().length === 0) {
      throw new Error('Project ID cannot be empty');
    }

    // Validate baselineId
    if (!data.baselineId || data.baselineId.trim().length === 0) {
      throw new Error('Baseline ID cannot be empty');
    }

    return {
      id: randomUUID(),
      projectId: data.projectId,
      baselineId: data.baselineId,
      status: RunStatus.NEW,
      createdAt: new Date(),
      config: data.config,
      statistics: {
        totalPages: 0,
        completedPages: 0,
        errorPages: 0,
        unchangedPages: 0,
        changedPages: 0,
        criticalDifferences: 0,
        acceptedDifferences: 0,
        mutedDifferences: 0,
      },
    };
  }

  /**
   * Starts a run (transitions from NEW to IN_PROGRESS)
   */
  static start(run: Run): Run {
    if (run.status !== RunStatus.NEW) {
      throw new Error('Run must be in NEW status to start');
    }

    return {
      ...run,
      status: RunStatus.IN_PROGRESS,
      startedAt: new Date(),
    };
  }

  /**
   * Completes a run (transitions from IN_PROGRESS to COMPLETED)
   */
  static complete(run: Run): Run {
    if (run.status !== RunStatus.IN_PROGRESS) {
      throw new Error('Run must be in IN_PROGRESS status to complete');
    }

    return {
      ...run,
      status: RunStatus.COMPLETED,
      completedAt: new Date(),
    };
  }

  /**
   * Interrupts a run (transitions from IN_PROGRESS to INTERRUPTED)
   */
  static interrupt(run: Run): Run {
    if (run.status !== RunStatus.IN_PROGRESS) {
      throw new Error('Run must be in IN_PROGRESS status to interrupt');
    }

    return {
      ...run,
      status: RunStatus.INTERRUPTED,
      interruptedAt: new Date(),
    };
  }

  /**
   * Updates run statistics
   */
  static updateStatistics(
    run: Run,
    updates: Partial<RunStatistics>,
  ): Run {
    return {
      ...run,
      statistics: {
        ...run.statistics,
        ...updates,
      },
    };
  }

  /**
   * Serializes run to JSON-compatible format
   */
  static toJSON(run: Run): Record<string, unknown> {
    return {
      id: run.id,
      projectId: run.projectId,
      baselineId: run.baselineId,
      status: run.status,
      createdAt: run.createdAt.toISOString(),
      startedAt: run.startedAt?.toISOString(),
      completedAt: run.completedAt?.toISOString(),
      interruptedAt: run.interruptedAt?.toISOString(),
      config: run.config,
      statistics: run.statistics,
    };
  }

  /**
   * Deserializes run from JSON
   */
  static fromJSON(data: {
    id: string;
    projectId: string;
    baselineId: string;
    status: RunStatus;
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
    interruptedAt?: string;
    config: RunConfig;
    statistics: RunStatistics;
  }): Run {
    return {
      id: data.id,
      projectId: data.projectId,
      baselineId: data.baselineId,
      status: data.status,
      createdAt: new Date(data.createdAt),
      startedAt: data.startedAt ? new Date(data.startedAt) : undefined,
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      interruptedAt: data.interruptedAt
        ? new Date(data.interruptedAt)
        : undefined,
      config: data.config,
      statistics: data.statistics,
    };
  }
}
