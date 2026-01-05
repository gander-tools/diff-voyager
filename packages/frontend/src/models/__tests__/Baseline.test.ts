import { describe, it, expect, beforeEach } from 'vitest';
import { BaselineModel } from '../Baseline';
import type { Baseline, RunConfig } from '@gander-tools/diff-voyager-shared';

describe('BaselineModel', () => {
  let mockBaseline: Baseline;
  let mockConfig: RunConfig;

  beforeEach(() => {
    mockConfig = {
      profile: 'visual_seo',
      viewport: {
        width: 1920,
        height: 1080,
      },
      captureHar: false,
      captureScreenshots: true,
      generateDiffImages: false,
    };

    mockBaseline = {
      id: 'baseline-1',
      projectId: 'project-1',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      runId: 'run-1',
      pageCount: 50,
      config: mockConfig,
    };
  });

  describe('constructor', () => {
    it('should create a BaselineModel instance from Baseline data', () => {
      const model = new BaselineModel(mockBaseline);

      expect(model.id).toBe('baseline-1');
      expect(model.projectId).toBe('project-1');
      expect(model.runId).toBe('run-1');
      expect(model.pageCount).toBe(50);
      expect(model.config).toEqual(mockConfig);
      expect(model.createdAt).toEqual(new Date('2024-01-01T00:00:00Z'));
    });
  });

  describe('create', () => {
    it('should create a new baseline with generated ID', () => {
      const newBaseline = BaselineModel.create({
        projectId: 'project-2',
        runId: 'run-2',
        pageCount: 100,
        config: mockConfig,
      });

      expect(newBaseline.id).toBeDefined();
      expect(newBaseline.id).toMatch(/^baseline-/);
      expect(newBaseline.projectId).toBe('project-2');
      expect(newBaseline.runId).toBe('run-2');
      expect(newBaseline.pageCount).toBe(100);
      expect(newBaseline.config).toEqual(mockConfig);
      expect(newBaseline.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('validation', () => {
    it('should validate a valid baseline', () => {
      const model = new BaselineModel(mockBaseline);
      const validation = model.validate();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it('should fail validation when projectId is empty', () => {
      const invalid = { ...mockBaseline, projectId: '' };
      const model = new BaselineModel(invalid);
      const validation = model.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Project ID is required');
    });

    it('should fail validation when runId is empty', () => {
      const invalid = { ...mockBaseline, runId: '' };
      const model = new BaselineModel(invalid);
      const validation = model.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Run ID is required');
    });

    it('should fail validation when pageCount is negative', () => {
      const invalid = { ...mockBaseline, pageCount: -1 };
      const model = new BaselineModel(invalid);
      const validation = model.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Page count must be non-negative');
    });

    it('should allow pageCount of zero', () => {
      const valid = { ...mockBaseline, pageCount: 0 };
      const model = new BaselineModel(valid);
      const validation = model.validate();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
    });
  });

  describe('toJSON', () => {
    it('should serialize to Baseline interface', () => {
      const model = new BaselineModel(mockBaseline);
      const json = model.toJSON();

      expect(json).toEqual(mockBaseline);
      expect(json.id).toBe(mockBaseline.id);
      expect(json.projectId).toBe(mockBaseline.projectId);
      expect(json.runId).toBe(mockBaseline.runId);
      expect(json.pageCount).toBe(mockBaseline.pageCount);
    });

    it('should produce JSON with Date object', () => {
      const model = new BaselineModel(mockBaseline);
      const json = model.toJSON();

      expect(json.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('clone', () => {
    it('should create a deep copy of the baseline model', () => {
      const model = new BaselineModel(mockBaseline);
      const cloned = model.clone();

      expect(cloned).not.toBe(model);
      expect(cloned.id).toBe(model.id);
      expect(cloned.projectId).toBe(model.projectId);
      expect(cloned.config).toEqual(model.config);
      expect(cloned.config).not.toBe(model.config);
    });
  });

  describe('helper methods', () => {
    it('should check if baseline has visual_seo profile', () => {
      const model = new BaselineModel(mockBaseline);
      expect(model.isVisualSeoProfile()).toBe(true);
    });

    it('should check if baseline has full profile', () => {
      const fullProfile = {
        ...mockBaseline,
        config: {
          ...mockBaseline.config,
          profile: 'full' as const,
        },
      };
      const model = new BaselineModel(fullProfile);
      expect(model.isFullProfile()).toBe(true);
    });

    it('should check if baseline has minimal profile', () => {
      const minimalProfile = {
        ...mockBaseline,
        config: {
          ...mockBaseline.config,
          profile: 'minimal' as const,
        },
      };
      const model = new BaselineModel(minimalProfile);
      expect(model.isMinimalProfile()).toBe(true);
    });

    it('should check if screenshots are captured', () => {
      const model = new BaselineModel(mockBaseline);
      expect(model.capturesScreenshots()).toBe(true);
    });

    it('should check if HAR files are captured', () => {
      const model = new BaselineModel(mockBaseline);
      expect(model.capturesHar()).toBe(false);
    });

    it('should check if diff images are generated', () => {
      const withDiffImages = {
        ...mockBaseline,
        config: {
          ...mockBaseline.config,
          generateDiffImages: true,
        },
      };
      const model = new BaselineModel(withDiffImages);
      expect(model.generatesDiffImages()).toBe(true);
    });

    it('should get viewport dimensions', () => {
      const model = new BaselineModel(mockBaseline);
      expect(model.getViewport()).toEqual({ width: 1920, height: 1080 });
    });

    it('should get page count', () => {
      const model = new BaselineModel(mockBaseline);
      expect(model.getPageCount()).toBe(50);
    });

    it('should check if baseline has pages', () => {
      const model = new BaselineModel(mockBaseline);
      expect(model.hasPages()).toBe(true);
    });

    it('should check if baseline has no pages', () => {
      const empty = { ...mockBaseline, pageCount: 0 };
      const model = new BaselineModel(empty);
      expect(model.hasPages()).toBe(false);
    });
  });
});
