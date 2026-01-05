import { describe, it, expect } from 'vitest';
import { RunModel } from '../models/Run.js';
import { RunStatus, RunProfile } from '@gander-tools/diff-voyager-shared';

describe('RunModel', () => {
  describe('create', () => {
    it('should create a new run with default configuration', () => {
      const run = RunModel.create({
        projectId: 'project-123',
        baselineId: 'baseline-123',
        profile: RunProfile.VISUAL_SEO,
      });

      expect(run.id).toBeTruthy();
      expect(run.projectId).toBe('project-123');
      expect(run.baselineId).toBe('baseline-123');
      expect(run.status).toBe(RunStatus.NEW);
      expect(run.createdAt).toBeInstanceOf(Date);
      expect(run.startedAt).toBeUndefined();
      expect(run.completedAt).toBeUndefined();
      expect(run.interruptedAt).toBeUndefined();
    });

    it('should initialize run configuration', () => {
      const run = RunModel.create({
        projectId: 'project-123',
        baselineId: 'baseline-123',
        profile: RunProfile.FULL,
        viewport: {
          width: 1280,
          height: 720,
        },
      });

      expect(run.config.profile).toBe(RunProfile.FULL);
      expect(run.config.viewport.width).toBe(1280);
      expect(run.config.viewport.height).toBe(720);
      expect(run.config.captureHar).toBe(true); // FULL profile includes HAR
      expect(run.config.captureScreenshots).toBe(true);
      expect(run.config.generateDiffImages).toBe(true);
    });

    it('should initialize statistics with zeros', () => {
      const run = RunModel.create({
        projectId: 'project-123',
        baselineId: 'baseline-123',
        profile: RunProfile.VISUAL_SEO,
      });

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

    it('should configure profile-specific settings for MINIMAL profile', () => {
      const run = RunModel.create({
        projectId: 'project-123',
        baselineId: 'baseline-123',
        profile: RunProfile.MINIMAL,
      });

      expect(run.config.captureHar).toBe(false);
      expect(run.config.captureScreenshots).toBe(false);
      expect(run.config.generateDiffImages).toBe(false);
    });
  });

  describe('start', () => {
    it('should transition run from NEW to IN_PROGRESS', () => {
      const run = RunModel.create({
        projectId: 'project-123',
        baselineId: 'baseline-123',
        profile: RunProfile.VISUAL_SEO,
      });

      const startedRun = RunModel.start(run);

      expect(startedRun.status).toBe(RunStatus.IN_PROGRESS);
      expect(startedRun.startedAt).toBeInstanceOf(Date);
    });

    it('should throw error if run is not in NEW status', () => {
      const run = RunModel.create({
        projectId: 'project-123',
        baselineId: 'baseline-123',
        profile: RunProfile.VISUAL_SEO,
      });

      const startedRun = RunModel.start(run);

      expect(() => {
        RunModel.start(startedRun);
      }).toThrow('Run must be in NEW status to start');
    });
  });

  describe('interrupt', () => {
    it('should transition run from IN_PROGRESS to INTERRUPTED', () => {
      const run = RunModel.create({
        projectId: 'project-123',
        baselineId: 'baseline-123',
        profile: RunProfile.VISUAL_SEO,
      });

      const startedRun = RunModel.start(run);
      const interruptedRun = RunModel.interrupt(startedRun);

      expect(interruptedRun.status).toBe(RunStatus.INTERRUPTED);
      expect(interruptedRun.interruptedAt).toBeInstanceOf(Date);
    });

    it('should throw error if run is not in IN_PROGRESS status', () => {
      const run = RunModel.create({
        projectId: 'project-123',
        baselineId: 'baseline-123',
        profile: RunProfile.VISUAL_SEO,
      });

      expect(() => {
        RunModel.interrupt(run);
      }).toThrow('Run must be in IN_PROGRESS status to interrupt');
    });
  });

  describe('resume', () => {
    it('should transition run from INTERRUPTED to IN_PROGRESS', () => {
      const run = RunModel.create({
        projectId: 'project-123',
        baselineId: 'baseline-123',
        profile: RunProfile.VISUAL_SEO,
      });

      const startedRun = RunModel.start(run);
      const interruptedRun = RunModel.interrupt(startedRun);
      const resumedRun = RunModel.resume(interruptedRun);

      expect(resumedRun.status).toBe(RunStatus.IN_PROGRESS);
      expect(resumedRun.interruptedAt).toBeUndefined();
    });

    it('should throw error if run is not in INTERRUPTED status', () => {
      const run = RunModel.create({
        projectId: 'project-123',
        baselineId: 'baseline-123',
        profile: RunProfile.VISUAL_SEO,
      });

      expect(() => {
        RunModel.resume(run);
      }).toThrow('Run must be in INTERRUPTED status to resume');
    });
  });

  describe('complete', () => {
    it('should transition run from IN_PROGRESS to COMPLETED', () => {
      const run = RunModel.create({
        projectId: 'project-123',
        baselineId: 'baseline-123',
        profile: RunProfile.VISUAL_SEO,
      });

      const startedRun = RunModel.start(run);
      const completedRun = RunModel.complete(startedRun);

      expect(completedRun.status).toBe(RunStatus.COMPLETED);
      expect(completedRun.completedAt).toBeInstanceOf(Date);
    });

    it('should throw error if run is not in IN_PROGRESS status', () => {
      const run = RunModel.create({
        projectId: 'project-123',
        baselineId: 'baseline-123',
        profile: RunProfile.VISUAL_SEO,
      });

      expect(() => {
        RunModel.complete(run);
      }).toThrow('Run must be in IN_PROGRESS status to complete');
    });
  });

  describe('updateStatistics', () => {
    it('should update run statistics', () => {
      const run = RunModel.create({
        projectId: 'project-123',
        baselineId: 'baseline-123',
        profile: RunProfile.VISUAL_SEO,
      });

      const updatedRun = RunModel.updateStatistics(run, {
        totalPages: 10,
        completedPages: 8,
        errorPages: 2,
        changedPages: 3,
        unchangedPages: 5,
        criticalDifferences: 1,
      });

      expect(updatedRun.statistics.totalPages).toBe(10);
      expect(updatedRun.statistics.completedPages).toBe(8);
      expect(updatedRun.statistics.errorPages).toBe(2);
      expect(updatedRun.statistics.changedPages).toBe(3);
      expect(updatedRun.statistics.unchangedPages).toBe(5);
      expect(updatedRun.statistics.criticalDifferences).toBe(1);
    });

    it('should merge statistics with existing values', () => {
      const run = RunModel.create({
        projectId: 'project-123',
        baselineId: 'baseline-123',
        profile: RunProfile.VISUAL_SEO,
      });

      const updated1 = RunModel.updateStatistics(run, {
        totalPages: 10,
        completedPages: 5,
      });

      const updated2 = RunModel.updateStatistics(updated1, {
        completedPages: 8,
        changedPages: 3,
      });

      expect(updated2.statistics.totalPages).toBe(10);
      expect(updated2.statistics.completedPages).toBe(8);
      expect(updated2.statistics.changedPages).toBe(3);
    });
  });

  describe('toJSON and fromJSON', () => {
    it('should serialize and deserialize run correctly', () => {
      const run = RunModel.create({
        projectId: 'project-123',
        baselineId: 'baseline-123',
        profile: RunProfile.VISUAL_SEO,
      });

      const startedRun = RunModel.start(run);
      const json = RunModel.toJSON(startedRun);
      const deserializedRun = RunModel.fromJSON(json);

      expect(deserializedRun.id).toBe(startedRun.id);
      expect(deserializedRun.projectId).toBe(startedRun.projectId);
      expect(deserializedRun.baselineId).toBe(startedRun.baselineId);
      expect(deserializedRun.status).toBe(startedRun.status);
      expect(deserializedRun.createdAt).toEqual(startedRun.createdAt);
      expect(deserializedRun.startedAt).toEqual(startedRun.startedAt);
    });
  });
});
