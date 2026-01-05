import {
  type Run,
  type RunConfig,
  type RunStatistics,
  type ViewportConfig,
  RunStatus,
  RunProfile,
} from '@gander-tools/diff-voyager-shared';
import { randomUUID } from 'node:crypto';

/**
 * Input parameters for creating a new run
 */
export interface CreateRunInput {
  projectId: string;
  baselineId: string;
  profile: RunProfile;
  viewport?: ViewportConfig;
  captureHar?: boolean;
  captureScreenshots?: boolean;
  generateDiffImages?: boolean;
}

/**
 * RunModel - Domain model for managing comparison runs
 *
 * Encapsulates business logic for run lifecycle management:
 * - Creating new runs
 * - State transitions (NEW -> IN_PROGRESS -> COMPLETED/INTERRUPTED)
 * - Statistics tracking
 * - Resume capability for interrupted runs
 */
export class RunModel {
  /**
   * Create a new run
   */
  static create(input: CreateRunInput): Run {
    const config = this.createRunConfig(input);

    const run: Run = {
      id: randomUUID(),
      projectId: input.projectId,
      baselineId: input.baselineId,
      status: RunStatus.NEW,
      createdAt: new Date(),
      config,
      statistics: this.createEmptyStatistics(),
    };

    return run;
  }

  /**
   * Start a run (NEW -> IN_PROGRESS)
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
   * Interrupt a running run (IN_PROGRESS -> INTERRUPTED)
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
   * Resume an interrupted run (INTERRUPTED -> IN_PROGRESS)
   */
  static resume(run: Run): Run {
    if (run.status !== RunStatus.INTERRUPTED) {
      throw new Error('Run must be in INTERRUPTED status to resume');
    }

    return {
      ...run,
      status: RunStatus.IN_PROGRESS,
      interruptedAt: undefined,
    };
  }

  /**
   * Complete a run (IN_PROGRESS -> COMPLETED)
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
   * Update run statistics
   */
  static updateStatistics(
    run: Run,
    updates: Partial<RunStatistics>
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
   * Serialize run to JSON
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
   * Deserialize run from JSON
   */
  static fromJSON(json: Record<string, unknown>): Run {
    return {
      id: json.id as string,
      projectId: json.projectId as string,
      baselineId: json.baselineId as string,
      status: json.status as RunStatus,
      createdAt: new Date(json.createdAt as string),
      startedAt: json.startedAt ? new Date(json.startedAt as string) : undefined,
      completedAt: json.completedAt
        ? new Date(json.completedAt as string)
        : undefined,
      interruptedAt: json.interruptedAt
        ? new Date(json.interruptedAt as string)
        : undefined,
      config: json.config as RunConfig,
      statistics: json.statistics as RunStatistics,
    };
  }

  /**
   * Create run configuration based on profile
   */
  private static createRunConfig(input: CreateRunInput): RunConfig {
    const viewport: ViewportConfig = input.viewport ?? {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    };

    // Determine artifact capture settings based on profile
    let captureHar: boolean;
    let captureScreenshots: boolean;
    let generateDiffImages: boolean;

    switch (input.profile) {
      case RunProfile.MINIMAL:
        captureHar = false;
        captureScreenshots = false;
        generateDiffImages = false;
        break;
      case RunProfile.VISUAL_SEO:
        captureHar = false;
        captureScreenshots = true;
        generateDiffImages = true;
        break;
      case RunProfile.FULL:
        captureHar = true;
        captureScreenshots = true;
        generateDiffImages = true;
        break;
      default:
        captureHar = false;
        captureScreenshots = true;
        generateDiffImages = true;
    }

    // Allow explicit overrides
    if (input.captureHar !== undefined) {
      captureHar = input.captureHar;
    }
    if (input.captureScreenshots !== undefined) {
      captureScreenshots = input.captureScreenshots;
    }
    if (input.generateDiffImages !== undefined) {
      generateDiffImages = input.generateDiffImages;
    }

    return {
      profile: input.profile,
      viewport,
      captureHar,
      captureScreenshots,
      generateDiffImages,
    };
  }

  /**
   * Create empty statistics object
   */
  private static createEmptyStatistics(): RunStatistics {
    return {
      totalPages: 0,
      completedPages: 0,
      errorPages: 0,
      unchangedPages: 0,
      changedPages: 0,
      criticalDifferences: 0,
      acceptedDifferences: 0,
      mutedDifferences: 0,
    };
  }
}
