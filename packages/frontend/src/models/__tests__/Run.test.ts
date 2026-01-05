import { describe, it, expect, beforeEach } from 'vitest';
import { RunModel } from '../Run';
import type {
  Run,
  RunConfig,
  RunStatistics,
  RunStatus,
} from '@gander-tools/diff-voyager-shared';

describe('RunModel', () => {
  let mockRun: Run;
  let mockConfig: RunConfig;
  let mockStatistics: RunStatistics;

  beforeEach(() => {
    mockConfig = {
      profile: 'visual_seo',
      viewport: {
        width: 1920,
        height: 1080,
      },
      captureHar: false,
      captureScreenshots: true,
      generateDiffImages: true,
    };

    mockStatistics = {
      totalPages: 100,
      completedPages: 95,
      errorPages: 5,
      unchangedPages: 50,
      changedPages: 40,
      criticalDifferences: 2,
      acceptedDifferences: 10,
      mutedDifferences: 5,
    };

    mockRun = {
      id: 'run-1',
      projectId: 'project-1',
      baselineId: 'baseline-1',
      status: 'completed',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      startedAt: new Date('2024-01-01T00:05:00Z'),
      completedAt: new Date('2024-01-01T01:00:00Z'),
      config: mockConfig,
      statistics: mockStatistics,
    };
  });

  describe('constructor', () => {
    it('should create a RunModel instance from Run data', () => {
      const model = new RunModel(mockRun);

      expect(model.id).toBe('run-1');
      expect(model.projectId).toBe('project-1');
      expect(model.baselineId).toBe('baseline-1');
      expect(model.status).toBe('completed');
      expect(model.config).toEqual(mockConfig);
      expect(model.statistics).toEqual(mockStatistics);
      expect(model.createdAt).toEqual(new Date('2024-01-01T00:00:00Z'));
      expect(model.startedAt).toEqual(new Date('2024-01-01T00:05:00Z'));
      expect(model.completedAt).toEqual(new Date('2024-01-01T01:00:00Z'));
    });
  });

  describe('create', () => {
    it('should create a new run with generated ID and default status', () => {
      const newRun = RunModel.create({
        projectId: 'project-2',
        baselineId: 'baseline-2',
        config: mockConfig,
      });

      expect(newRun.id).toBeDefined();
      expect(newRun.id).toMatch(/^run-/);
      expect(newRun.projectId).toBe('project-2');
      expect(newRun.baselineId).toBe('baseline-2');
      expect(newRun.status).toBe('new');
      expect(newRun.config).toEqual(mockConfig);
      expect(newRun.createdAt).toBeInstanceOf(Date);
      expect(newRun.startedAt).toBeUndefined();
      expect(newRun.completedAt).toBeUndefined();
      expect(newRun.statistics).toBeUndefined();
    });
  });

  describe('validation', () => {
    it('should validate a valid run', () => {
      const model = new RunModel(mockRun);
      const validation = model.validate();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it('should fail validation when projectId is empty', () => {
      const invalid = { ...mockRun, projectId: '' };
      const model = new RunModel(invalid);
      const validation = model.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Project ID is required');
    });

    it('should fail validation when baselineId is empty', () => {
      const invalid = { ...mockRun, baselineId: '' };
      const model = new RunModel(invalid);
      const validation = model.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Baseline ID is required');
    });

    it('should allow runs without statistics (new runs)', () => {
      const newRun = { ...mockRun, statistics: undefined };
      const model = new RunModel(newRun);
      const validation = model.validate();

      expect(validation.isValid).toBe(true);
    });
  });

  describe('status management', () => {
    it('should update status to in_progress', () => {
      const model = new RunModel({ ...mockRun, status: 'new' });
      const updated = model.start();

      expect(updated.status).toBe('in_progress');
      expect(updated.startedAt).toBeInstanceOf(Date);
      expect(updated.completedAt).toBeUndefined();
    });

    it('should update status to completed', () => {
      const model = new RunModel({ ...mockRun, status: 'in_progress' });
      const updated = model.complete();

      expect(updated.status).toBe('completed');
      expect(updated.completedAt).toBeInstanceOf(Date);
    });

    it('should update status to interrupted', () => {
      const model = new RunModel({ ...mockRun, status: 'in_progress' });
      const updated = model.interrupt();

      expect(updated.status).toBe('interrupted');
    });

    it('should check if run is new', () => {
      const model = new RunModel({ ...mockRun, status: 'new' });
      expect(model.isNew()).toBe(true);
      expect(model.isInProgress()).toBe(false);
    });

    it('should check if run is in progress', () => {
      const model = new RunModel({ ...mockRun, status: 'in_progress' });
      expect(model.isInProgress()).toBe(true);
      expect(model.isNew()).toBe(false);
    });

    it('should check if run is completed', () => {
      const model = new RunModel({ ...mockRun, status: 'completed' });
      expect(model.isCompleted()).toBe(true);
      expect(model.isInProgress()).toBe(false);
    });

    it('should check if run is interrupted', () => {
      const model = new RunModel({ ...mockRun, status: 'interrupted' });
      expect(model.isInterrupted()).toBe(true);
      expect(model.isCompleted()).toBe(false);
    });

    it('should check if run is finished', () => {
      const completed = new RunModel({ ...mockRun, status: 'completed' });
      const interrupted = new RunModel({ ...mockRun, status: 'interrupted' });
      const inProgress = new RunModel({ ...mockRun, status: 'in_progress' });

      expect(completed.isFinished()).toBe(true);
      expect(interrupted.isFinished()).toBe(true);
      expect(inProgress.isFinished()).toBe(false);
    });
  });

  describe('statistics', () => {
    it('should update statistics', () => {
      const model = new RunModel(mockRun);
      const newStats: RunStatistics = {
        ...mockStatistics,
        completedPages: 100,
        errorPages: 0,
      };

      const updated = model.updateStatistics(newStats);

      expect(updated.statistics).toEqual(newStats);
      expect(updated.statistics?.completedPages).toBe(100);
      expect(updated.statistics?.errorPages).toBe(0);
    });

    it('should get total pages', () => {
      const model = new RunModel(mockRun);
      expect(model.getTotalPages()).toBe(100);
    });

    it('should return 0 for total pages when no statistics', () => {
      const model = new RunModel({ ...mockRun, statistics: undefined });
      expect(model.getTotalPages()).toBe(0);
    });

    it('should get completed pages', () => {
      const model = new RunModel(mockRun);
      expect(model.getCompletedPages()).toBe(95);
    });

    it('should get error pages', () => {
      const model = new RunModel(mockRun);
      expect(model.getErrorPages()).toBe(5);
    });

    it('should get changed pages', () => {
      const model = new RunModel(mockRun);
      expect(model.getChangedPages()).toBe(40);
    });

    it('should get unchanged pages', () => {
      const model = new RunModel(mockRun);
      expect(model.getUnchangedPages()).toBe(50);
    });

    it('should get critical differences', () => {
      const model = new RunModel(mockRun);
      expect(model.getCriticalDifferences()).toBe(2);
    });

    it('should calculate progress percentage', () => {
      const model = new RunModel(mockRun);
      expect(model.getProgress()).toBe(95); // 95/100 * 100
    });

    it('should return 0 progress when no statistics', () => {
      const model = new RunModel({ ...mockRun, statistics: undefined });
      expect(model.getProgress()).toBe(0);
    });

    it('should calculate success rate', () => {
      const model = new RunModel(mockRun);
      expect(model.getSuccessRate()).toBe(95); // (100-5)/100 * 100
    });

    it('should check if run has critical differences', () => {
      const model = new RunModel(mockRun);
      expect(model.hasCriticalDifferences()).toBe(true);
    });

    it('should check if run has no critical differences', () => {
      const noCritical = {
        ...mockRun,
        statistics: {
          ...mockStatistics,
          criticalDifferences: 0,
        },
      };
      const model = new RunModel(noCritical);
      expect(model.hasCriticalDifferences()).toBe(false);
    });

    it('should check if run has changes', () => {
      const model = new RunModel(mockRun);
      expect(model.hasChanges()).toBe(true);
    });

    it('should check if run has no changes', () => {
      const noChanges = {
        ...mockRun,
        statistics: {
          ...mockStatistics,
          changedPages: 0,
        },
      };
      const model = new RunModel(noChanges);
      expect(model.hasChanges()).toBe(false);
    });
  });

  describe('duration calculation', () => {
    it('should calculate duration for completed run', () => {
      const model = new RunModel(mockRun);
      const duration = model.getDuration();

      // Duration: 1 hour = 3300000ms (55 minutes)
      expect(duration).toBe(3300000);
    });

    it('should return null for run without start time', () => {
      const model = new RunModel({ ...mockRun, startedAt: undefined });
      expect(model.getDuration()).toBeNull();
    });

    it('should calculate duration for in-progress run using current time', () => {
      const model = new RunModel({
        ...mockRun,
        status: 'in_progress',
        startedAt: new Date(Date.now() - 60000), // Started 1 minute ago
        completedAt: undefined,
      });

      const duration = model.getDuration();
      expect(duration).toBeGreaterThanOrEqual(60000);
      expect(duration).toBeLessThan(65000); // Allow some margin
    });
  });

  describe('toJSON', () => {
    it('should serialize to Run interface', () => {
      const model = new RunModel(mockRun);
      const json = model.toJSON();

      expect(json).toEqual(mockRun);
      expect(json.id).toBe(mockRun.id);
      expect(json.projectId).toBe(mockRun.projectId);
      expect(json.statistics).toEqual(mockRun.statistics);
    });
  });

  describe('clone', () => {
    it('should create a deep copy of the run model', () => {
      const model = new RunModel(mockRun);
      const cloned = model.clone();

      expect(cloned).not.toBe(model);
      expect(cloned.id).toBe(model.id);
      expect(cloned.config).toEqual(model.config);
      expect(cloned.config).not.toBe(model.config);
      expect(cloned.statistics).toEqual(model.statistics);
      expect(cloned.statistics).not.toBe(model.statistics);
    });
  });

  describe('helper methods', () => {
    it('should check if run uses visual_seo profile', () => {
      const model = new RunModel(mockRun);
      expect(model.isVisualSeoProfile()).toBe(true);
    });

    it('should check if screenshots are captured', () => {
      const model = new RunModel(mockRun);
      expect(model.capturesScreenshots()).toBe(true);
    });

    it('should check if HAR files are captured', () => {
      const model = new RunModel(mockRun);
      expect(model.capturesHar()).toBe(false);
    });

    it('should check if diff images are generated', () => {
      const model = new RunModel(mockRun);
      expect(model.generatesDiffImages()).toBe(true);
    });
  });
});
