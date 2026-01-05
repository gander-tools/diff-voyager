import type {
  Diff,
  Change,
  DiffType,
  DiffSeverity,
  DiffStatus,
} from '@gander-tools/diff-voyager-shared';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface CreateDiffParams {
  pageId: string;
  runId: string;
  baselineSnapshotId: string;
  runSnapshotId: string;
  changes: Change[];
}

export class DiffModel implements Diff {
  id: string;
  pageId: string;
  runId: string;
  baselineSnapshotId: string;
  runSnapshotId: string;
  changes: Change[];
  summary: {
    totalChanges: number;
    criticalChanges: number;
    warningChanges: number;
    infoChanges: number;
    newChanges: number;
    acceptedChanges: number;
    mutedChanges: number;
  };

  constructor(data: Diff) {
    this.id = data.id;
    this.pageId = data.pageId;
    this.runId = data.runId;
    this.baselineSnapshotId = data.baselineSnapshotId;
    this.runSnapshotId = data.runSnapshotId;
    this.changes = data.changes;
    this.summary = data.summary;
  }

  /**
   * Creates a new diff with calculated summary
   */
  static create(params: CreateDiffParams): DiffModel {
    const summary = DiffModel.calculateSummary(params.changes);

    const diff: Diff = {
      id: DiffModel.generateId(),
      pageId: params.pageId,
      runId: params.runId,
      baselineSnapshotId: params.baselineSnapshotId,
      runSnapshotId: params.runSnapshotId,
      changes: params.changes,
      summary,
    };

    return new DiffModel(diff);
  }

  /**
   * Generates a unique ID for a new diff
   */
  private static generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `diff-${timestamp}-${random}`;
  }

  /**
   * Calculates summary statistics from changes
   */
  private static calculateSummary(changes: Change[]): Diff['summary'] {
    return {
      totalChanges: changes.length,
      criticalChanges: changes.filter((c) => c.severity === 'critical').length,
      warningChanges: changes.filter((c) => c.severity === 'warning').length,
      infoChanges: changes.filter((c) => c.severity === 'info').length,
      newChanges: changes.filter((c) => c.status === 'new').length,
      acceptedChanges: changes.filter((c) => c.status === 'accepted').length,
      mutedChanges: changes.filter((c) => c.status === 'muted').length,
    };
  }

  /**
   * Validates the diff data
   */
  validate(): ValidationResult {
    const errors: string[] = [];

    // Validate pageId
    if (!this.pageId || this.pageId.trim().length === 0) {
      errors.push('Page ID is required');
    }

    // Validate runId
    if (!this.runId || this.runId.trim().length === 0) {
      errors.push('Run ID is required');
    }

    // Validate baselineSnapshotId
    if (!this.baselineSnapshotId || this.baselineSnapshotId.trim().length === 0) {
      errors.push('Baseline snapshot ID is required');
    }

    // Validate runSnapshotId
    if (!this.runSnapshotId || this.runSnapshotId.trim().length === 0) {
      errors.push('Run snapshot ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Gets changes filtered by type
   */
  getChangesByType(type: DiffType): Change[] {
    return this.changes.filter((change) => change.type === type);
  }

  /**
   * Gets changes filtered by severity
   */
  getChangesBySeverity(severity: DiffSeverity): Change[] {
    return this.changes.filter((change) => change.severity === severity);
  }

  /**
   * Gets changes filtered by status
   */
  getChangesByStatus(status: DiffStatus): Change[] {
    return this.changes.filter((change) => change.status === status);
  }

  /**
   * Gets all critical changes
   */
  getCriticalChanges(): Change[] {
    return this.getChangesBySeverity('critical');
  }

  /**
   * Gets all muted changes
   */
  getMutedChanges(): Change[] {
    return this.getChangesByStatus('muted');
  }

  /**
   * Gets all accepted changes
   */
  getAcceptedChanges(): Change[] {
    return this.getChangesByStatus('accepted');
  }

  /**
   * Gets total number of changes
   */
  getTotalChanges(): number {
    return this.summary.totalChanges;
  }

  /**
   * Gets count of critical changes
   */
  getCriticalCount(): number {
    return this.summary.criticalChanges;
  }

  /**
   * Gets count of warning changes
   */
  getWarningCount(): number {
    return this.summary.warningChanges;
  }

  /**
   * Gets count of info changes
   */
  getInfoCount(): number {
    return this.summary.infoChanges;
  }

  /**
   * Gets count of new changes
   */
  getNewCount(): number {
    return this.summary.newChanges;
  }

  /**
   * Gets count of muted changes
   */
  getMutedCount(): number {
    return this.summary.mutedChanges;
  }

  /**
   * Gets count of accepted changes
   */
  getAcceptedCount(): number {
    return this.summary.acceptedChanges;
  }

  /**
   * Checks if diff has any changes
   */
  hasChanges(): boolean {
    return this.changes.length > 0;
  }

  /**
   * Checks if diff has critical changes
   */
  hasCriticalChanges(): boolean {
    return this.summary.criticalChanges > 0;
  }

  /**
   * Checks if diff has unresolved changes (new status)
   */
  hasUnresolvedChanges(): boolean {
    return this.changes.some((c) => c.status === 'new');
  }

  /**
   * Accepts a change by ID
   */
  acceptChange(changeId: string, acceptedBy: string): DiffModel {
    const updatedChanges = this.changes.map((change) => {
      if (change.id === changeId) {
        return {
          ...change,
          status: 'accepted' as DiffStatus,
          acceptedAt: new Date(),
          acceptedBy,
        };
      }
      return change;
    });

    const updated: Diff = {
      ...this.toJSON(),
      changes: updatedChanges,
      summary: DiffModel.calculateSummary(updatedChanges),
    };

    return new DiffModel(updated);
  }

  /**
   * Mutes a change by ID with a rule
   */
  muteChange(changeId: string, ruleId: string): DiffModel {
    const updatedChanges = this.changes.map((change) => {
      if (change.id === changeId) {
        return {
          ...change,
          status: 'muted' as DiffStatus,
          mutedByRuleId: ruleId,
        };
      }
      return change;
    });

    const updated: Diff = {
      ...this.toJSON(),
      changes: updatedChanges,
      summary: DiffModel.calculateSummary(updatedChanges),
    };

    return new DiffModel(updated);
  }

  /**
   * Unmutes a change by ID
   */
  unmuteChange(changeId: string): DiffModel {
    const updatedChanges = this.changes.map((change) => {
      if (change.id === changeId) {
        const { mutedByRuleId, ...rest } = change;
        return {
          ...rest,
          status: 'new' as DiffStatus,
        };
      }
      return change;
    });

    const updated: Diff = {
      ...this.toJSON(),
      changes: updatedChanges,
      summary: DiffModel.calculateSummary(updatedChanges),
    };

    return new DiffModel(updated);
  }

  /**
   * Accepts all changes
   */
  acceptAllChanges(acceptedBy: string): DiffModel {
    const updatedChanges = this.changes.map((change) => ({
      ...change,
      status: 'accepted' as DiffStatus,
      acceptedAt: new Date(),
      acceptedBy,
    }));

    const updated: Diff = {
      ...this.toJSON(),
      changes: updatedChanges,
      summary: DiffModel.calculateSummary(updatedChanges),
    };

    return new DiffModel(updated);
  }

  /**
   * Serializes the diff to JSON
   */
  toJSON(): Diff {
    return {
      id: this.id,
      pageId: this.pageId,
      runId: this.runId,
      baselineSnapshotId: this.baselineSnapshotId,
      runSnapshotId: this.runSnapshotId,
      changes: this.changes,
      summary: this.summary,
    };
  }

  /**
   * Creates a deep copy of the diff
   */
  clone(): DiffModel {
    const cloned: Diff = {
      id: this.id,
      pageId: this.pageId,
      runId: this.runId,
      baselineSnapshotId: this.baselineSnapshotId,
      runSnapshotId: this.runSnapshotId,
      changes: JSON.parse(JSON.stringify(this.changes)),
      summary: { ...this.summary },
    };

    return new DiffModel(cloned);
  }
}
