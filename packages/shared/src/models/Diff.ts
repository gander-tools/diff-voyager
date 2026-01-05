import { randomUUID } from 'node:crypto';
import type {
  Diff,
  Change,
  ChangeDetails,
  DiffSummary,
} from '../types/index.js';
import { DiffType, DiffStatus, DiffSeverity } from '../enums/index.js';

/**
 * Domain model for Diff with validation and business logic
 */
export class DiffModel {
  /**
   * Creates a new diff with validation
   */
  static create(data: {
    pageId: string;
    runId: string;
    baselineSnapshotId: string;
    runSnapshotId: string;
    changes: Change[];
  }): Diff {
    // Validate pageId
    if (!data.pageId || data.pageId.trim().length === 0) {
      throw new Error('Page ID cannot be empty');
    }

    // Validate runId
    if (!data.runId || data.runId.trim().length === 0) {
      throw new Error('Run ID cannot be empty');
    }

    // Validate baselineSnapshotId
    if (
      !data.baselineSnapshotId ||
      data.baselineSnapshotId.trim().length === 0
    ) {
      throw new Error('Baseline snapshot ID cannot be empty');
    }

    // Validate runSnapshotId
    if (!data.runSnapshotId || data.runSnapshotId.trim().length === 0) {
      throw new Error('Run snapshot ID cannot be empty');
    }

    // Calculate summary
    const summary = this.calculateSummary(data.changes);

    return {
      id: randomUUID(),
      pageId: data.pageId,
      runId: data.runId,
      baselineSnapshotId: data.baselineSnapshotId,
      runSnapshotId: data.runSnapshotId,
      createdAt: new Date(),
      changes: data.changes,
      summary,
    };
  }

  /**
   * Creates a new change with validation
   */
  static createChange(data: {
    type: DiffType;
    severity: DiffSeverity;
    description: string;
    details: ChangeDetails;
  }): Change {
    // Validate description
    if (!data.description || data.description.trim().length === 0) {
      throw new Error('Change description cannot be empty');
    }

    return {
      id: randomUUID(),
      type: data.type,
      severity: data.severity,
      status: DiffStatus.NEW,
      description: data.description,
      details: data.details,
    };
  }

  /**
   * Marks a change as accepted
   */
  static acceptChange(change: Change, acceptedBy?: string): Change {
    return {
      ...change,
      status: DiffStatus.ACCEPTED,
      acceptedAt: new Date(),
      acceptedBy,
    };
  }

  /**
   * Marks a change as muted by a rule
   */
  static muteChange(change: Change, ruleId: string): Change {
    if (!ruleId || ruleId.trim().length === 0) {
      throw new Error('Rule ID cannot be empty');
    }

    return {
      ...change,
      status: DiffStatus.MUTED,
      mutedByRuleId: ruleId,
    };
  }

  /**
   * Calculates summary statistics for changes
   */
  private static calculateSummary(changes: Change[]): DiffSummary {
    const changesByType: Record<DiffType, number> = {
      [DiffType.SEO]: 0,
      [DiffType.VISUAL]: 0,
      [DiffType.CONTENT]: 0,
      [DiffType.PERFORMANCE]: 0,
      [DiffType.HTTP_STATUS]: 0,
      [DiffType.HEADERS]: 0,
    };

    let criticalChanges = 0;
    let acceptedChanges = 0;
    let mutedChanges = 0;

    for (const change of changes) {
      changesByType[change.type]++;

      if (change.severity === DiffSeverity.CRITICAL) {
        criticalChanges++;
      }

      if (change.status === DiffStatus.ACCEPTED) {
        acceptedChanges++;
      }

      if (change.status === DiffStatus.MUTED) {
        mutedChanges++;
      }
    }

    return {
      totalChanges: changes.length,
      criticalChanges,
      acceptedChanges,
      mutedChanges,
      changesByType,
      thresholdExceeded: criticalChanges > 0,
    };
  }

  /**
   * Serializes diff to JSON-compatible format
   */
  static toJSON(diff: Diff): Record<string, unknown> {
    return {
      id: diff.id,
      pageId: diff.pageId,
      runId: diff.runId,
      baselineSnapshotId: diff.baselineSnapshotId,
      runSnapshotId: diff.runSnapshotId,
      createdAt: diff.createdAt.toISOString(),
      changes: diff.changes.map((change) => ({
        ...change,
        acceptedAt: change.acceptedAt?.toISOString(),
      })),
      summary: diff.summary,
    };
  }

  /**
   * Deserializes diff from JSON
   */
  static fromJSON(data: {
    id: string;
    pageId: string;
    runId: string;
    baselineSnapshotId: string;
    runSnapshotId: string;
    createdAt: string;
    changes: Array<Change & { acceptedAt?: string }>;
    summary: DiffSummary;
  }): Diff {
    return {
      id: data.id,
      pageId: data.pageId,
      runId: data.runId,
      baselineSnapshotId: data.baselineSnapshotId,
      runSnapshotId: data.runSnapshotId,
      createdAt: new Date(data.createdAt),
      changes: data.changes.map((change) => ({
        ...change,
        acceptedAt: change.acceptedAt
          ? new Date(change.acceptedAt)
          : undefined,
      })),
      summary: data.summary,
    };
  }
}
