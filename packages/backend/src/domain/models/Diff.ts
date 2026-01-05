import {
  type Diff,
  type Change,
  type ChangeDetails,
  type DiffSummary,
  DiffType,
  DiffSeverity,
  DiffStatus,
} from '@gander-tools/diff-voyager-shared';
import { randomUUID } from 'node:crypto';

/**
 * Input for creating a change
 */
export interface CreateChangeInput {
  type: DiffType;
  severity: DiffSeverity;
  description: string;
  details: ChangeDetails;
}

/**
 * Input parameters for creating a new diff
 */
export interface CreateDiffInput {
  pageId: string;
  runId: string;
  baselineSnapshotId: string;
  runSnapshotId: string;
  changes?: CreateChangeInput[];
  visualDiffPercentage?: number;
  visualDiffPixels?: number;
  threshold?: number;
}

/**
 * DiffModel - Domain model for managing differences between snapshots
 *
 * Encapsulates business logic for:
 * - Creating diffs with changes
 * - Managing change status (NEW, ACCEPTED, MUTED)
 * - Calculating diff summary statistics
 * - Applying mute rules to changes
 */
export class DiffModel {
  /**
   * Create a new diff
   */
  static create(input: CreateDiffInput): Diff {
    const changes: Change[] = (input.changes ?? []).map((changeInput) =>
      this.createChange(changeInput)
    );

    const summary = this.calculateSummary(
      changes,
      input.visualDiffPercentage,
      input.visualDiffPixels,
      input.threshold
    );

    const diff: Diff = {
      id: randomUUID(),
      pageId: input.pageId,
      runId: input.runId,
      baselineSnapshotId: input.baselineSnapshotId,
      runSnapshotId: input.runSnapshotId,
      createdAt: new Date(),
      changes,
      summary,
    };

    return diff;
  }

  /**
   * Add a change to an existing diff
   */
  static addChange(diff: Diff, changeInput: CreateChangeInput): Diff {
    const newChange = this.createChange(changeInput);
    const changes = [...diff.changes, newChange];
    const summary = this.calculateSummary(
      changes,
      diff.summary.visualDiffPercentage,
      diff.summary.visualDiffPixels,
      diff.summary.thresholdExceeded ? diff.summary.visualDiffPercentage : undefined
    );

    return {
      ...diff,
      changes,
      summary,
    };
  }

  /**
   * Mark a change as accepted
   */
  static acceptChange(diff: Diff, changeId: string): Diff {
    const changeIndex = diff.changes.findIndex((c) => c.id === changeId);
    if (changeIndex === -1) {
      throw new Error('Change not found');
    }

    const updatedChanges = [...diff.changes];
    updatedChanges[changeIndex] = {
      ...updatedChanges[changeIndex],
      status: DiffStatus.ACCEPTED,
      acceptedAt: new Date(),
    };

    const summary = this.calculateSummary(
      updatedChanges,
      diff.summary.visualDiffPercentage,
      diff.summary.visualDiffPixels
    );

    return {
      ...diff,
      changes: updatedChanges,
      summary,
    };
  }

  /**
   * Unaccept a change (revert to NEW status)
   */
  static unacceptChange(diff: Diff, changeId: string): Diff {
    const changeIndex = diff.changes.findIndex((c) => c.id === changeId);
    if (changeIndex === -1) {
      throw new Error('Change not found');
    }

    const updatedChanges = [...diff.changes];
    updatedChanges[changeIndex] = {
      ...updatedChanges[changeIndex],
      status: DiffStatus.NEW,
      acceptedAt: undefined,
    };

    const summary = this.calculateSummary(
      updatedChanges,
      diff.summary.visualDiffPercentage,
      diff.summary.visualDiffPixels
    );

    return {
      ...diff,
      changes: updatedChanges,
      summary,
    };
  }

  /**
   * Mark a change as muted by a rule
   */
  static muteChange(diff: Diff, changeId: string, ruleId: string): Diff {
    const changeIndex = diff.changes.findIndex((c) => c.id === changeId);
    if (changeIndex === -1) {
      throw new Error('Change not found');
    }

    const updatedChanges = [...diff.changes];
    updatedChanges[changeIndex] = {
      ...updatedChanges[changeIndex],
      status: DiffStatus.MUTED,
      mutedByRuleId: ruleId,
    };

    const summary = this.calculateSummary(
      updatedChanges,
      diff.summary.visualDiffPercentage,
      diff.summary.visualDiffPixels
    );

    return {
      ...diff,
      changes: updatedChanges,
      summary,
    };
  }

  /**
   * Serialize diff to JSON
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
   * Deserialize diff from JSON
   */
  static fromJSON(json: Record<string, unknown>): Diff {
    const changes = (json.changes as Array<Record<string, unknown>>).map(
      (change) => ({
        id: change.id as string,
        type: change.type as DiffType,
        severity: change.severity as DiffSeverity,
        status: change.status as DiffStatus,
        description: change.description as string,
        details: change.details as ChangeDetails,
        mutedByRuleId: change.mutedByRuleId as string | undefined,
        acceptedAt: change.acceptedAt
          ? new Date(change.acceptedAt as string)
          : undefined,
        acceptedBy: change.acceptedBy as string | undefined,
      })
    );

    return {
      id: json.id as string,
      pageId: json.pageId as string,
      runId: json.runId as string,
      baselineSnapshotId: json.baselineSnapshotId as string,
      runSnapshotId: json.runSnapshotId as string,
      createdAt: new Date(json.createdAt as string),
      changes,
      summary: json.summary as DiffSummary,
    };
  }

  /**
   * Create a change object
   */
  private static createChange(input: CreateChangeInput): Change {
    return {
      id: randomUUID(),
      type: input.type,
      severity: input.severity,
      status: DiffStatus.NEW,
      description: input.description,
      details: input.details,
    };
  }

  /**
   * Calculate diff summary from changes
   */
  private static calculateSummary(
    changes: Change[],
    visualDiffPercentage?: number,
    visualDiffPixels?: number,
    threshold?: number
  ): DiffSummary {
    const totalChanges = changes.length;
    const criticalChanges = changes.filter(
      (c) => c.severity === DiffSeverity.CRITICAL && c.status === DiffStatus.NEW
    ).length;
    const acceptedChanges = changes.filter(
      (c) => c.status === DiffStatus.ACCEPTED
    ).length;
    const mutedChanges = changes.filter(
      (c) => c.status === DiffStatus.MUTED
    ).length;

    const changesByType: Record<DiffType, number> = {
      [DiffType.SEO]: 0,
      [DiffType.VISUAL]: 0,
      [DiffType.CONTENT]: 0,
      [DiffType.PERFORMANCE]: 0,
      [DiffType.HTTP_STATUS]: 0,
      [DiffType.HEADERS]: 0,
    };

    for (const change of changes) {
      changesByType[change.type]++;
    }

    const thresholdExceeded =
      threshold !== undefined && visualDiffPercentage !== undefined
        ? visualDiffPercentage > threshold
        : false;

    return {
      totalChanges,
      criticalChanges,
      acceptedChanges,
      mutedChanges,
      changesByType,
      visualDiffPercentage,
      visualDiffPixels,
      thresholdExceeded,
    };
  }
}
