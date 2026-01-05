import { describe, it, expect } from 'vitest';
import { DiffModel } from '../models/Diff.js';
import { DiffType, DiffSeverity, DiffStatus } from '@gander-tools/diff-voyager-shared';

describe('DiffModel', () => {
  describe('create', () => {
    it('should create a new diff with empty changes', () => {
      const diff = DiffModel.create({
        pageId: 'page-123',
        runId: 'run-123',
        baselineSnapshotId: 'snapshot-baseline',
        runSnapshotId: 'snapshot-run',
      });

      expect(diff.id).toBeTruthy();
      expect(diff.pageId).toBe('page-123');
      expect(diff.runId).toBe('run-123');
      expect(diff.baselineSnapshotId).toBe('snapshot-baseline');
      expect(diff.runSnapshotId).toBe('snapshot-run');
      expect(diff.createdAt).toBeInstanceOf(Date);
      expect(diff.changes).toEqual([]);
      expect(diff.summary.totalChanges).toBe(0);
      expect(diff.summary.thresholdExceeded).toBe(false);
    });

    it('should create diff with changes', () => {
      const diff = DiffModel.create({
        pageId: 'page-123',
        runId: 'run-123',
        baselineSnapshotId: 'snapshot-baseline',
        runSnapshotId: 'snapshot-run',
        changes: [
          {
            type: DiffType.SEO,
            severity: DiffSeverity.CRITICAL,
            description: 'Title changed',
            details: {
              field: 'title',
              oldValue: 'Old Title',
              newValue: 'New Title',
            },
          },
        ],
      });

      expect(diff.changes).toHaveLength(1);
      expect(diff.changes[0].id).toBeTruthy();
      expect(diff.changes[0].type).toBe(DiffType.SEO);
      expect(diff.changes[0].severity).toBe(DiffSeverity.CRITICAL);
      expect(diff.changes[0].status).toBe(DiffStatus.NEW);
      expect(diff.changes[0].description).toBe('Title changed');
      expect(diff.summary.totalChanges).toBe(1);
      expect(diff.summary.criticalChanges).toBe(1);
    });

    it('should calculate summary statistics correctly', () => {
      const diff = DiffModel.create({
        pageId: 'page-123',
        runId: 'run-123',
        baselineSnapshotId: 'snapshot-baseline',
        runSnapshotId: 'snapshot-run',
        changes: [
          {
            type: DiffType.SEO,
            severity: DiffSeverity.CRITICAL,
            description: 'Title changed',
            details: {},
          },
          {
            type: DiffType.VISUAL,
            severity: DiffSeverity.WARNING,
            description: 'Visual difference detected',
            details: {},
          },
          {
            type: DiffType.CONTENT,
            severity: DiffSeverity.INFO,
            description: 'Content changed',
            details: {},
          },
        ],
      });

      expect(diff.summary.totalChanges).toBe(3);
      expect(diff.summary.criticalChanges).toBe(1);
      expect(diff.summary.changesByType[DiffType.SEO]).toBe(1);
      expect(diff.summary.changesByType[DiffType.VISUAL]).toBe(1);
      expect(diff.summary.changesByType[DiffType.CONTENT]).toBe(1);
    });

    it('should set visual diff metadata when provided', () => {
      const diff = DiffModel.create({
        pageId: 'page-123',
        runId: 'run-123',
        baselineSnapshotId: 'snapshot-baseline',
        runSnapshotId: 'snapshot-run',
        visualDiffPercentage: 2.5,
        visualDiffPixels: 1000,
        threshold: 1.0,
      });

      expect(diff.summary.visualDiffPercentage).toBe(2.5);
      expect(diff.summary.visualDiffPixels).toBe(1000);
      expect(diff.summary.thresholdExceeded).toBe(true);
    });

    it('should not exceed threshold when below limit', () => {
      const diff = DiffModel.create({
        pageId: 'page-123',
        runId: 'run-123',
        baselineSnapshotId: 'snapshot-baseline',
        runSnapshotId: 'snapshot-run',
        visualDiffPercentage: 0.5,
        threshold: 1.0,
      });

      expect(diff.summary.thresholdExceeded).toBe(false);
    });
  });

  describe('addChange', () => {
    it('should add a change to the diff', () => {
      const diff = DiffModel.create({
        pageId: 'page-123',
        runId: 'run-123',
        baselineSnapshotId: 'snapshot-baseline',
        runSnapshotId: 'snapshot-run',
      });

      const updatedDiff = DiffModel.addChange(diff, {
        type: DiffType.SEO,
        severity: DiffSeverity.CRITICAL,
        description: 'Meta description changed',
        details: {
          field: 'metaDescription',
          oldValue: 'Old description',
          newValue: 'New description',
        },
      });

      expect(updatedDiff.changes).toHaveLength(1);
      expect(updatedDiff.summary.totalChanges).toBe(1);
      expect(updatedDiff.summary.criticalChanges).toBe(1);
    });

    it('should recalculate summary when adding changes', () => {
      let diff = DiffModel.create({
        pageId: 'page-123',
        runId: 'run-123',
        baselineSnapshotId: 'snapshot-baseline',
        runSnapshotId: 'snapshot-run',
      });

      diff = DiffModel.addChange(diff, {
        type: DiffType.SEO,
        severity: DiffSeverity.CRITICAL,
        description: 'Change 1',
        details: {},
      });

      diff = DiffModel.addChange(diff, {
        type: DiffType.VISUAL,
        severity: DiffSeverity.WARNING,
        description: 'Change 2',
        details: {},
      });

      expect(diff.summary.totalChanges).toBe(2);
      expect(diff.summary.criticalChanges).toBe(1);
      expect(diff.summary.changesByType[DiffType.SEO]).toBe(1);
      expect(diff.summary.changesByType[DiffType.VISUAL]).toBe(1);
    });
  });

  describe('acceptChange', () => {
    it('should mark a change as accepted', () => {
      const diff = DiffModel.create({
        pageId: 'page-123',
        runId: 'run-123',
        baselineSnapshotId: 'snapshot-baseline',
        runSnapshotId: 'snapshot-run',
        changes: [
          {
            type: DiffType.SEO,
            severity: DiffSeverity.CRITICAL,
            description: 'Title changed',
            details: {},
          },
        ],
      });

      const changeId = diff.changes[0].id;
      const updatedDiff = DiffModel.acceptChange(diff, changeId);

      expect(updatedDiff.changes[0].status).toBe(DiffStatus.ACCEPTED);
      expect(updatedDiff.changes[0].acceptedAt).toBeInstanceOf(Date);
      expect(updatedDiff.summary.acceptedChanges).toBe(1);
    });

    it('should throw error if change not found', () => {
      const diff = DiffModel.create({
        pageId: 'page-123',
        runId: 'run-123',
        baselineSnapshotId: 'snapshot-baseline',
        runSnapshotId: 'snapshot-run',
      });

      expect(() => {
        DiffModel.acceptChange(diff, 'non-existent-id');
      }).toThrow('Change not found');
    });
  });

  describe('muteChange', () => {
    it('should mark a change as muted with rule reference', () => {
      const diff = DiffModel.create({
        pageId: 'page-123',
        runId: 'run-123',
        baselineSnapshotId: 'snapshot-baseline',
        runSnapshotId: 'snapshot-run',
        changes: [
          {
            type: DiffType.CONTENT,
            severity: DiffSeverity.INFO,
            description: 'Timestamp changed',
            details: {},
          },
        ],
      });

      const changeId = diff.changes[0].id;
      const updatedDiff = DiffModel.muteChange(diff, changeId, 'rule-123');

      expect(updatedDiff.changes[0].status).toBe(DiffStatus.MUTED);
      expect(updatedDiff.changes[0].mutedByRuleId).toBe('rule-123');
      expect(updatedDiff.summary.mutedChanges).toBe(1);
    });
  });

  describe('unacceptChange', () => {
    it('should revert an accepted change to NEW status', () => {
      const diff = DiffModel.create({
        pageId: 'page-123',
        runId: 'run-123',
        baselineSnapshotId: 'snapshot-baseline',
        runSnapshotId: 'snapshot-run',
        changes: [
          {
            type: DiffType.SEO,
            severity: DiffSeverity.CRITICAL,
            description: 'Title changed',
            details: {},
          },
        ],
      });

      const changeId = diff.changes[0].id;
      const acceptedDiff = DiffModel.acceptChange(diff, changeId);
      const revertedDiff = DiffModel.unacceptChange(acceptedDiff, changeId);

      expect(revertedDiff.changes[0].status).toBe(DiffStatus.NEW);
      expect(revertedDiff.changes[0].acceptedAt).toBeUndefined();
      expect(revertedDiff.summary.acceptedChanges).toBe(0);
    });
  });

  describe('toJSON and fromJSON', () => {
    it('should serialize and deserialize diff correctly', () => {
      const diff = DiffModel.create({
        pageId: 'page-123',
        runId: 'run-123',
        baselineSnapshotId: 'snapshot-baseline',
        runSnapshotId: 'snapshot-run',
        changes: [
          {
            type: DiffType.SEO,
            severity: DiffSeverity.CRITICAL,
            description: 'Title changed',
            details: { field: 'title' },
          },
        ],
        visualDiffPercentage: 1.5,
        visualDiffPixels: 500,
        threshold: 1.0,
      });

      const json = DiffModel.toJSON(diff);
      const deserializedDiff = DiffModel.fromJSON(json);

      expect(deserializedDiff.id).toBe(diff.id);
      expect(deserializedDiff.pageId).toBe(diff.pageId);
      expect(deserializedDiff.changes).toHaveLength(1);
      expect(deserializedDiff.summary.visualDiffPercentage).toBe(1.5);
      expect(deserializedDiff.summary.thresholdExceeded).toBe(true);
    });
  });
});
