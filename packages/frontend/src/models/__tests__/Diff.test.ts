import { describe, it, expect, beforeEach } from 'vitest';
import { DiffModel } from '../Diff';
import type { Diff, Change, DiffType, DiffStatus, DiffSeverity } from '@gander-tools/diff-voyager-shared';

describe('DiffModel', () => {
  let mockChanges: Change[];
  let mockDiff: Diff;

  beforeEach(() => {
    mockChanges = [
      {
        id: 'change-1',
        type: 'seo',
        severity: 'critical',
        status: 'new',
        description: 'Title changed',
        details: {
          field: 'title',
          before: 'Old Title',
          after: 'New Title',
        },
      },
      {
        id: 'change-2',
        type: 'visual',
        severity: 'warning',
        status: 'new',
        description: 'Visual difference detected',
        details: {
          pixelDiff: 0.05,
        },
      },
      {
        id: 'change-3',
        type: 'content',
        severity: 'info',
        status: 'muted',
        description: 'Content changed',
        details: {},
        mutedByRuleId: 'rule-1',
      },
    ];

    mockDiff = {
      id: 'diff-1',
      pageId: 'page-1',
      runId: 'run-1',
      baselineSnapshotId: 'snapshot-1',
      runSnapshotId: 'snapshot-2',
      changes: mockChanges,
      summary: {
        totalChanges: 3,
        criticalChanges: 1,
        warningChanges: 1,
        infoChanges: 1,
        newChanges: 2,
        acceptedChanges: 0,
        mutedChanges: 1,
      },
    };
  });

  describe('constructor', () => {
    it('should create a DiffModel instance from Diff data', () => {
      const model = new DiffModel(mockDiff);

      expect(model.id).toBe('diff-1');
      expect(model.pageId).toBe('page-1');
      expect(model.runId).toBe('run-1');
      expect(model.baselineSnapshotId).toBe('snapshot-1');
      expect(model.runSnapshotId).toBe('snapshot-2');
      expect(model.changes).toEqual(mockChanges);
      expect(model.summary).toEqual(mockDiff.summary);
    });
  });

  describe('create', () => {
    it('should create a new diff with generated ID and calculated summary', () => {
      const newDiff = DiffModel.create({
        pageId: 'page-2',
        runId: 'run-2',
        baselineSnapshotId: 'snapshot-3',
        runSnapshotId: 'snapshot-4',
        changes: mockChanges,
      });

      expect(newDiff.id).toBeDefined();
      expect(newDiff.id).toMatch(/^diff-/);
      expect(newDiff.pageId).toBe('page-2');
      expect(newDiff.changes).toEqual(mockChanges);
      expect(newDiff.summary.totalChanges).toBe(3);
      expect(newDiff.summary.criticalChanges).toBe(1);
    });

    it('should create empty diff with no changes', () => {
      const emptyDiff = DiffModel.create({
        pageId: 'page-2',
        runId: 'run-2',
        baselineSnapshotId: 'snapshot-3',
        runSnapshotId: 'snapshot-4',
        changes: [],
      });

      expect(emptyDiff.summary.totalChanges).toBe(0);
      expect(emptyDiff.summary.criticalChanges).toBe(0);
    });
  });

  describe('validation', () => {
    it('should validate a valid diff', () => {
      const model = new DiffModel(mockDiff);
      const validation = model.validate();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it('should fail validation when pageId is empty', () => {
      const invalid = { ...mockDiff, pageId: '' };
      const model = new DiffModel(invalid);
      const validation = model.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Page ID is required');
    });

    it('should fail validation when runId is empty', () => {
      const invalid = { ...mockDiff, runId: '' };
      const model = new DiffModel(invalid);
      const validation = model.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Run ID is required');
    });

    it('should fail validation when baselineSnapshotId is empty', () => {
      const invalid = { ...mockDiff, baselineSnapshotId: '' };
      const model = new DiffModel(invalid);
      const validation = model.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Baseline snapshot ID is required');
    });

    it('should fail validation when runSnapshotId is empty', () => {
      const invalid = { ...mockDiff, runSnapshotId: '' };
      const model = new DiffModel(invalid);
      const validation = model.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Run snapshot ID is required');
    });
  });

  describe('change filtering', () => {
    it('should get changes by type', () => {
      const model = new DiffModel(mockDiff);
      const seoChanges = model.getChangesByType('seo');

      expect(seoChanges).toHaveLength(1);
      expect(seoChanges[0].type).toBe('seo');
    });

    it('should get changes by severity', () => {
      const model = new DiffModel(mockDiff);
      const criticalChanges = model.getChangesBySeverity('critical');

      expect(criticalChanges).toHaveLength(1);
      expect(criticalChanges[0].severity).toBe('critical');
    });

    it('should get changes by status', () => {
      const model = new DiffModel(mockDiff);
      const newChanges = model.getChangesByStatus('new');

      expect(newChanges).toHaveLength(2);
      expect(newChanges.every((c) => c.status === 'new')).toBe(true);
    });

    it('should get critical changes', () => {
      const model = new DiffModel(mockDiff);
      const critical = model.getCriticalChanges();

      expect(critical).toHaveLength(1);
      expect(critical[0].severity).toBe('critical');
    });

    it('should get muted changes', () => {
      const model = new DiffModel(mockDiff);
      const muted = model.getMutedChanges();

      expect(muted).toHaveLength(1);
      expect(muted[0].status).toBe('muted');
    });

    it('should get accepted changes', () => {
      const acceptedDiff = {
        ...mockDiff,
        changes: [
          ...mockChanges,
          {
            id: 'change-4',
            type: 'seo' as DiffType,
            severity: 'info' as DiffSeverity,
            status: 'accepted' as DiffStatus,
            description: 'Accepted change',
            details: {},
            acceptedAt: new Date(),
            acceptedBy: 'user-1',
          },
        ],
      };
      const model = new DiffModel(acceptedDiff);
      const accepted = model.getAcceptedChanges();

      expect(accepted).toHaveLength(1);
      expect(accepted[0].status).toBe('accepted');
    });
  });

  describe('change statistics', () => {
    it('should get total change count', () => {
      const model = new DiffModel(mockDiff);
      expect(model.getTotalChanges()).toBe(3);
    });

    it('should get critical change count', () => {
      const model = new DiffModel(mockDiff);
      expect(model.getCriticalCount()).toBe(1);
    });

    it('should get warning change count', () => {
      const model = new DiffModel(mockDiff);
      expect(model.getWarningCount()).toBe(1);
    });

    it('should get info change count', () => {
      const model = new DiffModel(mockDiff);
      expect(model.getInfoCount()).toBe(1);
    });

    it('should get new change count', () => {
      const model = new DiffModel(mockDiff);
      expect(model.getNewCount()).toBe(2);
    });

    it('should get muted change count', () => {
      const model = new DiffModel(mockDiff);
      expect(model.getMutedCount()).toBe(1);
    });

    it('should get accepted change count', () => {
      const model = new DiffModel(mockDiff);
      expect(model.getAcceptedCount()).toBe(0);
    });
  });

  describe('change status checks', () => {
    it('should check if diff has changes', () => {
      const model = new DiffModel(mockDiff);
      expect(model.hasChanges()).toBe(true);
    });

    it('should check if diff has no changes', () => {
      const noDiff = {
        ...mockDiff,
        changes: [],
        summary: {
          totalChanges: 0,
          criticalChanges: 0,
          warningChanges: 0,
          infoChanges: 0,
          newChanges: 0,
          acceptedChanges: 0,
          mutedChanges: 0,
        },
      };
      const model = new DiffModel(noDiff);
      expect(model.hasChanges()).toBe(false);
    });

    it('should check if diff has critical changes', () => {
      const model = new DiffModel(mockDiff);
      expect(model.hasCriticalChanges()).toBe(true);
    });

    it('should check if diff has unresolved changes', () => {
      const model = new DiffModel(mockDiff);
      expect(model.hasUnresolvedChanges()).toBe(true);
    });

    it('should check if all changes are resolved', () => {
      const allResolved = {
        ...mockDiff,
        changes: mockChanges.map((c) => ({ ...c, status: 'accepted' as DiffStatus })),
      };
      const model = new DiffModel(allResolved);
      expect(model.hasUnresolvedChanges()).toBe(false);
    });
  });

  describe('change management', () => {
    it('should accept a change by ID', () => {
      const model = new DiffModel(mockDiff);
      const updated = model.acceptChange('change-1', 'user-1');

      const change = updated.changes.find((c) => c.id === 'change-1');
      expect(change?.status).toBe('accepted');
      expect(change?.acceptedBy).toBe('user-1');
      expect(change?.acceptedAt).toBeInstanceOf(Date);
    });

    it('should mute a change by ID', () => {
      const model = new DiffModel(mockDiff);
      const updated = model.muteChange('change-1', 'rule-2');

      const change = updated.changes.find((c) => c.id === 'change-1');
      expect(change?.status).toBe('muted');
      expect(change?.mutedByRuleId).toBe('rule-2');
    });

    it('should unmute a change by ID', () => {
      const model = new DiffModel(mockDiff);
      const updated = model.unmuteChange('change-3');

      const change = updated.changes.find((c) => c.id === 'change-3');
      expect(change?.status).toBe('new');
      expect(change?.mutedByRuleId).toBeUndefined();
    });

    it('should accept all changes', () => {
      const model = new DiffModel(mockDiff);
      const updated = model.acceptAllChanges('user-1');

      expect(updated.changes.every((c) => c.status === 'accepted')).toBe(true);
      expect(updated.changes.every((c) => c.acceptedBy === 'user-1')).toBe(true);
    });
  });

  describe('toJSON', () => {
    it('should serialize to Diff interface', () => {
      const model = new DiffModel(mockDiff);
      const json = model.toJSON();

      expect(json).toEqual(mockDiff);
      expect(json.id).toBe(mockDiff.id);
      expect(json.changes).toEqual(mockDiff.changes);
      expect(json.summary).toEqual(mockDiff.summary);
    });
  });

  describe('clone', () => {
    it('should create a deep copy of the diff model', () => {
      const model = new DiffModel(mockDiff);
      const cloned = model.clone();

      expect(cloned).not.toBe(model);
      expect(cloned.id).toBe(model.id);
      expect(cloned.changes).toEqual(model.changes);
      expect(cloned.changes).not.toBe(model.changes);
    });
  });
});
