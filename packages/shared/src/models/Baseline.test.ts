import { describe, it, expect } from 'vitest';
import { BaselineModel } from './Baseline.js';
import { RunProfile } from '../enums/index.js';
import type { ProjectConfig } from '../types/index.js';

describe('BaselineModel', () => {
  const validConfig: ProjectConfig = {
    crawl: {
      baseUrl: 'https://example.com',
      scopeRules: {
        includeDomains: ['example.com'],
        includeSubdomains: true,
        excludePatterns: [],
      },
    },
    runProfile: RunProfile.VISUAL_SEO,
    ignoreFilters: {
      cssSelectors: [],
      xpathSelectors: [],
      httpHeaders: [],
      anonymizeFields: [],
    },
    viewport: {
      width: 1920,
      height: 1080,
    },
    thresholds: {
      visualDiffPercentage: 0.1,
    },
  };

  describe('create', () => {
    it('should create a new baseline with valid data', () => {
      const baseline = BaselineModel.create({
        projectId: 'project-123',
        runId: 'run-456',
        pageCount: 42,
        config: validConfig,
      });

      expect(baseline.id).toBeDefined();
      expect(baseline.projectId).toBe('project-123');
      expect(baseline.runId).toBe('run-456');
      expect(baseline.pageCount).toBe(42);
      expect(baseline.createdAt).toBeInstanceOf(Date);
      expect(baseline.config).toEqual(validConfig);
    });

    it('should generate unique IDs for different baselines', () => {
      const baseline1 = BaselineModel.create({
        projectId: 'project-123',
        runId: 'run-456',
        pageCount: 10,
        config: validConfig,
      });

      const baseline2 = BaselineModel.create({
        projectId: 'project-123',
        runId: 'run-789',
        pageCount: 20,
        config: validConfig,
      });

      expect(baseline1.id).not.toBe(baseline2.id);
    });

    it('should throw error if projectId is empty', () => {
      expect(() =>
        BaselineModel.create({
          projectId: '',
          runId: 'run-456',
          pageCount: 10,
          config: validConfig,
        }),
      ).toThrow('Project ID cannot be empty');
    });

    it('should throw error if runId is empty', () => {
      expect(() =>
        BaselineModel.create({
          projectId: 'project-123',
          runId: '',
          pageCount: 10,
          config: validConfig,
        }),
      ).toThrow('Run ID cannot be empty');
    });

    it('should throw error if pageCount is negative', () => {
      expect(() =>
        BaselineModel.create({
          projectId: 'project-123',
          runId: 'run-456',
          pageCount: -1,
          config: validConfig,
        }),
      ).toThrow('Page count must be non-negative');
    });

    it('should accept zero page count', () => {
      const baseline = BaselineModel.create({
        projectId: 'project-123',
        runId: 'run-456',
        pageCount: 0,
        config: validConfig,
      });

      expect(baseline.pageCount).toBe(0);
    });
  });

  describe('toJSON', () => {
    it('should serialize baseline to JSON', () => {
      const baseline = BaselineModel.create({
        projectId: 'project-123',
        runId: 'run-456',
        pageCount: 42,
        config: validConfig,
      });

      const json = BaselineModel.toJSON(baseline);

      expect(json.id).toBe(baseline.id);
      expect(json.projectId).toBe('project-123');
      expect(json.runId).toBe('run-456');
      expect(json.pageCount).toBe(42);
      expect(json.createdAt).toBe(baseline.createdAt.toISOString());
      expect(json.config).toEqual(validConfig);
    });
  });

  describe('fromJSON', () => {
    it('should deserialize baseline from JSON', () => {
      const json = {
        id: 'baseline-123',
        projectId: 'project-456',
        runId: 'run-789',
        pageCount: 42,
        createdAt: '2024-01-01T00:00:00.000Z',
        config: validConfig,
      };

      const baseline = BaselineModel.fromJSON(json);

      expect(baseline.id).toBe('baseline-123');
      expect(baseline.projectId).toBe('project-456');
      expect(baseline.runId).toBe('run-789');
      expect(baseline.pageCount).toBe(42);
      expect(baseline.createdAt).toBeInstanceOf(Date);
      expect(baseline.createdAt.toISOString()).toBe(
        '2024-01-01T00:00:00.000Z',
      );
      expect(baseline.config).toEqual(validConfig);
    });
  });
});
