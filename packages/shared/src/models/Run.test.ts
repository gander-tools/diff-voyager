import { describe, it, expect } from 'vitest';
import { RunModel } from './Run.js';
import { RunStatus, RunProfile } from '../enums/index.js';

describe('RunModel', () => {
  describe('create', () => {
    it('should create a new run with valid data', () => {
      const run = RunModel.create({
        projectId: 'project-123',
        baselineId: 'baseline-456',
        config: {
          profile: RunProfile.VISUAL_SEO,
          viewport: { width: 1920, height: 1080 },
          captureHar: false,
          captureScreenshots: true,
          generateDiffImages: true,
        },
      });

      expect(run.id).toBeDefined();
      expect(run.projectId).toBe('project-123');
      expect(run.baselineId).toBe('baseline-456');
      expect(run.status).toBe(RunStatus.NEW);
      expect(run.createdAt).toBeInstanceOf(Date);
      expect(run.startedAt).toBeUndefined();
      expect(run.completedAt).toBeUndefined();
      expect(run.interruptedAt).toBeUndefined();
      expect(run.statistics).toEqual({
        totalPages: 0,
        completedPages: 0,
        errorPages: 0,
        unchangedPages: 0,
        changedPages: 0,
        criticalDifferences: 0,
        acceptedDifferences: 0,
        mutedDifferences: 0,
      });
    });

    it('should throw error if projectId is empty', () => {
      expect(() =>
        RunModel.create({
          projectId: '',
          baselineId: 'baseline-456',
          config: {
            profile: RunProfile.VISUAL_SEO,
            viewport: { width: 1920, height: 1080 },
            captureHar: false,
            captureScreenshots: true,
            generateDiffImages: true,
          },
        }),
      ).toThrow('Project ID cannot be empty');
    });

    it('should throw error if baselineId is empty', () => {
      expect(() =>
        RunModel.create({
          projectId: 'project-123',
          baselineId: '',
          config: {
            profile: RunProfile.VISUAL_SEO,
            viewport: { width: 1920, height: 1080 },
            captureHar: false,
            captureScreenshots: true,
            generateDiffImages: true,
          },
        }),
      ).toThrow('Baseline ID cannot be empty');
    });
  });

  describe('start', () => {
    it('should transition run from NEW to IN_PROGRESS', () => {
      const run = RunModel.create({
        projectId: 'project-123',
        baselineId: 'baseline-456',
        config: {
          profile: RunProfile.VISUAL_SEO,
          viewport: { width: 1920, height: 1080 },
          captureHar: false,
          captureScreenshots: true,
          generateDiffImages: true,
        },
      });

      const started = RunModel.start(run);

      expect(started.status).toBe(RunStatus.IN_PROGRESS);
      expect(started.startedAt).toBeInstanceOf(Date);
      expect(started.completedAt).toBeUndefined();
      expect(started.interruptedAt).toBeUndefined();
    });

    it('should throw error if run is not in NEW status', () => {
      const run = RunModel.create({
        projectId: 'project-123',
        baselineId: 'baseline-456',
        config: {
          profile: RunProfile.VISUAL_SEO,
          viewport: { width: 1920, height: 1080 },
          captureHar: false,
          captureScreenshots: true,
          generateDiffImages: true,
        },
      });

      const started = RunModel.start(run);

      expect(() => RunModel.start(started)).toThrow(
        'Run must be in NEW status to start',
      );
    });
  });

  describe('complete', () => {
    it('should transition run from IN_PROGRESS to COMPLETED', () => {
      const run = RunModel.create({
        projectId: 'project-123',
        baselineId: 'baseline-456',
        config: {
          profile: RunProfile.VISUAL_SEO,
          viewport: { width: 1920, height: 1080 },
          captureHar: false,
          captureScreenshots: true,
          generateDiffImages: true,
        },
      });

      const started = RunModel.start(run);
      const completed = RunModel.complete(started);

      expect(completed.status).toBe(RunStatus.COMPLETED);
      expect(completed.completedAt).toBeInstanceOf(Date);
      expect(completed.interruptedAt).toBeUndefined();
    });

    it('should throw error if run is not in IN_PROGRESS status', () => {
      const run = RunModel.create({
        projectId: 'project-123',
        baselineId: 'baseline-456',
        config: {
          profile: RunProfile.VISUAL_SEO,
          viewport: { width: 1920, height: 1080 },
          captureHar: false,
          captureScreenshots: true,
          generateDiffImages: true,
        },
      });

      expect(() => RunModel.complete(run)).toThrow(
        'Run must be in IN_PROGRESS status to complete',
      );
    });
  });

  describe('interrupt', () => {
    it('should transition run from IN_PROGRESS to INTERRUPTED', () => {
      const run = RunModel.create({
        projectId: 'project-123',
        baselineId: 'baseline-456',
        config: {
          profile: RunProfile.VISUAL_SEO,
          viewport: { width: 1920, height: 1080 },
          captureHar: false,
          captureScreenshots: true,
          generateDiffImages: true,
        },
      });

      const started = RunModel.start(run);
      const interrupted = RunModel.interrupt(started);

      expect(interrupted.status).toBe(RunStatus.INTERRUPTED);
      expect(interrupted.interruptedAt).toBeInstanceOf(Date);
      expect(interrupted.completedAt).toBeUndefined();
    });

    it('should throw error if run is not in IN_PROGRESS status', () => {
      const run = RunModel.create({
        projectId: 'project-123',
        baselineId: 'baseline-456',
        config: {
          profile: RunProfile.VISUAL_SEO,
          viewport: { width: 1920, height: 1080 },
          captureHar: false,
          captureScreenshots: true,
          generateDiffImages: true,
        },
      });

      expect(() => RunModel.interrupt(run)).toThrow(
        'Run must be in IN_PROGRESS status to interrupt',
      );
    });
  });

  describe('updateStatistics', () => {
    it('should update run statistics', () => {
      const run = RunModel.create({
        projectId: 'project-123',
        baselineId: 'baseline-456',
        config: {
          profile: RunProfile.VISUAL_SEO,
          viewport: { width: 1920, height: 1080 },
          captureHar: false,
          captureScreenshots: true,
          generateDiffImages: true,
        },
      });

      const updated = RunModel.updateStatistics(run, {
        totalPages: 100,
        completedPages: 50,
        errorPages: 2,
        unchangedPages: 30,
        changedPages: 18,
        criticalDifferences: 5,
        acceptedDifferences: 3,
        mutedDifferences: 2,
      });

      expect(updated.statistics.totalPages).toBe(100);
      expect(updated.statistics.completedPages).toBe(50);
      expect(updated.statistics.errorPages).toBe(2);
      expect(updated.statistics.unchangedPages).toBe(30);
      expect(updated.statistics.changedPages).toBe(18);
      expect(updated.statistics.criticalDifferences).toBe(5);
    });

    it('should partially update statistics', () => {
      const run = RunModel.create({
        projectId: 'project-123',
        baselineId: 'baseline-456',
        config: {
          profile: RunProfile.VISUAL_SEO,
          viewport: { width: 1920, height: 1080 },
          captureHar: false,
          captureScreenshots: true,
          generateDiffImages: true,
        },
      });

      const updated = RunModel.updateStatistics(run, {
        totalPages: 100,
      });

      expect(updated.statistics.totalPages).toBe(100);
      expect(updated.statistics.completedPages).toBe(0);
    });
  });

  describe('toJSON', () => {
    it('should serialize run to JSON', () => {
      const run = RunModel.create({
        projectId: 'project-123',
        baselineId: 'baseline-456',
        config: {
          profile: RunProfile.VISUAL_SEO,
          viewport: { width: 1920, height: 1080 },
          captureHar: false,
          captureScreenshots: true,
          generateDiffImages: true,
        },
      });

      const json = RunModel.toJSON(run);

      expect(json.id).toBe(run.id);
      expect(json.projectId).toBe('project-123');
      expect(json.status).toBe(RunStatus.NEW);
      expect(json.createdAt).toBe(run.createdAt.toISOString());
    });
  });

  describe('fromJSON', () => {
    it('should deserialize run from JSON', () => {
      const json = {
        id: 'run-123',
        projectId: 'project-456',
        baselineId: 'baseline-789',
        status: RunStatus.COMPLETED,
        createdAt: '2024-01-01T00:00:00.000Z',
        startedAt: '2024-01-01T00:01:00.000Z',
        completedAt: '2024-01-01T00:10:00.000Z',
        config: {
          profile: RunProfile.VISUAL_SEO,
          viewport: { width: 1920, height: 1080 },
          captureHar: false,
          captureScreenshots: true,
          generateDiffImages: true,
        },
        statistics: {
          totalPages: 100,
          completedPages: 100,
          errorPages: 0,
          unchangedPages: 80,
          changedPages: 20,
          criticalDifferences: 5,
          acceptedDifferences: 10,
          mutedDifferences: 5,
        },
      };

      const run = RunModel.fromJSON(json);

      expect(run.id).toBe('run-123');
      expect(run.status).toBe(RunStatus.COMPLETED);
      expect(run.createdAt).toBeInstanceOf(Date);
      expect(run.startedAt).toBeInstanceOf(Date);
      expect(run.completedAt).toBeInstanceOf(Date);
    });
  });
});
