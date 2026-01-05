import { describe, it, expect } from 'vitest';
import { DiffModel } from './Diff.js';
import { DiffType, DiffStatus, DiffSeverity } from '../enums/index.js';
import type { Change, ChangeDetails } from '../types/index.js';

describe('DiffModel', () => {
  const sampleChange: Change = {
    id: 'change-1',
    type: DiffType.SEO,
    severity: DiffSeverity.CRITICAL,
    status: DiffStatus.NEW,
    description: 'Meta description changed',
    details: {
      field: 'metaDescription',
      oldValue: 'Old description',
      newValue: 'New description',
    },
  };

  describe('create', () => {
    it('should create a new diff with valid data', () => {
      const diff = DiffModel.create({
        pageId: 'page-123',
        runId: 'run-456',
        baselineSnapshotId: 'snapshot-base',
        runSnapshotId: 'snapshot-run',
        changes: [sampleChange],
      });

      expect(diff.id).toBeDefined();
      expect(diff.pageId).toBe('page-123');
      expect(diff.runId).toBe('run-456');
      expect(diff.baselineSnapshotId).toBe('snapshot-base');
      expect(diff.runSnapshotId).toBe('snapshot-run');
      expect(diff.createdAt).toBeInstanceOf(Date);
      expect(diff.changes).toHaveLength(1);
      expect(diff.summary.totalChanges).toBe(1);
      expect(diff.summary.criticalChanges).toBe(1);
    });

    it('should create diff with empty changes', () => {
      const diff = DiffModel.create({
        pageId: 'page-123',
        runId: 'run-456',
        baselineSnapshotId: 'snapshot-base',
        runSnapshotId: 'snapshot-run',
        changes: [],
      });

      expect(diff.changes).toHaveLength(0);
      expect(diff.summary.totalChanges).toBe(0);
      expect(diff.summary.criticalChanges).toBe(0);
    });

    it('should calculate summary correctly', () => {
      const changes: Change[] = [
        {
          id: 'change-1',
          type: DiffType.SEO,
          severity: DiffSeverity.CRITICAL,
          status: DiffStatus.NEW,
          description: 'Title changed',
          details: {},
        },
        {
          id: 'change-2',
          type: DiffType.VISUAL,
          severity: DiffSeverity.WARNING,
          status: DiffStatus.ACCEPTED,
          description: 'Visual change detected',
          details: {},
          acceptedAt: new Date(),
        },
        {
          id: 'change-3',
          type: DiffType.CONTENT,
          severity: DiffSeverity.INFO,
          status: DiffStatus.MUTED,
          description: 'Content changed',
          details: {},
          mutedByRuleId: 'rule-123',
        },
      ];

      const diff = DiffModel.create({
        pageId: 'page-123',
        runId: 'run-456',
        baselineSnapshotId: 'snapshot-base',
        runSnapshotId: 'snapshot-run',
        changes,
      });

      expect(diff.summary.totalChanges).toBe(3);
      expect(diff.summary.criticalChanges).toBe(1);
      expect(diff.summary.acceptedChanges).toBe(1);
      expect(diff.summary.mutedChanges).toBe(1);
      expect(diff.summary.changesByType[DiffType.SEO]).toBe(1);
      expect(diff.summary.changesByType[DiffType.VISUAL]).toBe(1);
      expect(diff.summary.changesByType[DiffType.CONTENT]).toBe(1);
    });

    it('should set threshold exceeded based on critical changes', () => {
      const criticalChange: Change = {
        id: 'change-1',
        type: DiffType.SEO,
        severity: DiffSeverity.CRITICAL,
        status: DiffStatus.NEW,
        description: 'Critical change',
        details: {},
      };

      const diff = DiffModel.create({
        pageId: 'page-123',
        runId: 'run-456',
        baselineSnapshotId: 'snapshot-base',
        runSnapshotId: 'snapshot-run',
        changes: [criticalChange],
      });

      expect(diff.summary.thresholdExceeded).toBe(true);
    });

    it('should not exceed threshold with no critical changes', () => {
      const infoChange: Change = {
        id: 'change-1',
        type: DiffType.CONTENT,
        severity: DiffSeverity.INFO,
        status: DiffStatus.NEW,
        description: 'Info change',
        details: {},
      };

      const diff = DiffModel.create({
        pageId: 'page-123',
        runId: 'run-456',
        baselineSnapshotId: 'snapshot-base',
        runSnapshotId: 'snapshot-run',
        changes: [infoChange],
      });

      expect(diff.summary.thresholdExceeded).toBe(false);
    });

    it('should throw error if pageId is empty', () => {
      expect(() =>
        DiffModel.create({
          pageId: '',
          runId: 'run-456',
          baselineSnapshotId: 'snapshot-base',
          runSnapshotId: 'snapshot-run',
          changes: [],
        }),
      ).toThrow('Page ID cannot be empty');
    });

    it('should throw error if runId is empty', () => {
      expect(() =>
        DiffModel.create({
          pageId: 'page-123',
          runId: '',
          baselineSnapshotId: 'snapshot-base',
          runSnapshotId: 'snapshot-run',
          changes: [],
        }),
      ).toThrow('Run ID cannot be empty');
    });
  });

  describe('createChange', () => {
    it('should create a new change with valid data', () => {
      const change = DiffModel.createChange({
        type: DiffType.SEO,
        severity: DiffSeverity.CRITICAL,
        description: 'Meta description changed',
        details: {
          field: 'metaDescription',
          oldValue: 'Old',
          newValue: 'New',
        },
      });

      expect(change.id).toBeDefined();
      expect(change.type).toBe(DiffType.SEO);
      expect(change.severity).toBe(DiffSeverity.CRITICAL);
      expect(change.status).toBe(DiffStatus.NEW);
      expect(change.description).toBe('Meta description changed');
      expect(change.details.field).toBe('metaDescription');
    });

    it('should throw error if description is empty', () => {
      expect(() =>
        DiffModel.createChange({
          type: DiffType.SEO,
          severity: DiffSeverity.CRITICAL,
          description: '',
          details: {},
        }),
      ).toThrow('Change description cannot be empty');
    });
  });

  describe('acceptChange', () => {
    it('should mark change as accepted', () => {
      const change: Change = {
        id: 'change-1',
        type: DiffType.SEO,
        severity: DiffSeverity.WARNING,
        status: DiffStatus.NEW,
        description: 'Change',
        details: {},
      };

      const accepted = DiffModel.acceptChange(change, 'user-123');

      expect(accepted.status).toBe(DiffStatus.ACCEPTED);
      expect(accepted.acceptedAt).toBeInstanceOf(Date);
      expect(accepted.acceptedBy).toBe('user-123');
    });
  });

  describe('muteChange', () => {
    it('should mark change as muted with rule ID', () => {
      const change: Change = {
        id: 'change-1',
        type: DiffType.VISUAL,
        severity: DiffSeverity.INFO,
        status: DiffStatus.NEW,
        description: 'Change',
        details: {},
      };

      const muted = DiffModel.muteChange(change, 'rule-456');

      expect(muted.status).toBe(DiffStatus.MUTED);
      expect(muted.mutedByRuleId).toBe('rule-456');
    });

    it('should throw error if ruleId is empty', () => {
      const change: Change = {
        id: 'change-1',
        type: DiffType.VISUAL,
        severity: DiffSeverity.INFO,
        status: DiffStatus.NEW,
        description: 'Change',
        details: {},
      };

      expect(() => DiffModel.muteChange(change, '')).toThrow(
        'Rule ID cannot be empty',
      );
    });
  });

  describe('toJSON', () => {
    it('should serialize diff to JSON', () => {
      const diff = DiffModel.create({
        pageId: 'page-123',
        runId: 'run-456',
        baselineSnapshotId: 'snapshot-base',
        runSnapshotId: 'snapshot-run',
        changes: [sampleChange],
      });

      const json = DiffModel.toJSON(diff);

      expect(json.id).toBe(diff.id);
      expect(json.pageId).toBe('page-123');
      expect(json.createdAt).toBe(diff.createdAt.toISOString());
      expect(json.changes).toHaveLength(1);
    });
  });

  describe('fromJSON', () => {
    it('should deserialize diff from JSON', () => {
      const json = {
        id: 'diff-123',
        pageId: 'page-456',
        runId: 'run-789',
        baselineSnapshotId: 'snapshot-base',
        runSnapshotId: 'snapshot-run',
        createdAt: '2024-01-01T00:00:00.000Z',
        changes: [
          {
            ...sampleChange,
            acceptedAt: '2024-01-02T00:00:00.000Z',
          },
        ],
        summary: {
          totalChanges: 1,
          criticalChanges: 1,
          acceptedChanges: 0,
          mutedChanges: 0,
          changesByType: {
            [DiffType.SEO]: 1,
            [DiffType.VISUAL]: 0,
            [DiffType.CONTENT]: 0,
            [DiffType.PERFORMANCE]: 0,
            [DiffType.HTTP_STATUS]: 0,
            [DiffType.HEADERS]: 0,
          },
          thresholdExceeded: true,
        },
      };

      const diff = DiffModel.fromJSON(json);

      expect(diff.id).toBe('diff-123');
      expect(diff.createdAt).toBeInstanceOf(Date);
      expect(diff.changes[0].acceptedAt).toBeInstanceOf(Date);
    });
  });
});
