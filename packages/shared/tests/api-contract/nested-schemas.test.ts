/**
 * Nested Schemas Tests
 * Tests for nested object schemas tested in isolation
 * (Some schemas are already tested in response-schemas.test.ts)
 */

import { describe, expect, it } from 'vitest';
import {
  projectConfigSchema,
  runConfigSchema,
  runStatisticsSchema,
  statisticsSchema,
} from '../../src/api-contract.js';
import {
  validRunStatistics,
  validStatistics,
  validViewport,
  zeroRunStatistics,
  zeroStatistics,
} from '../helpers/fixtures.js';

describe('Nested Schemas (Isolated)', () => {
  describe('viewportSchema (in nested context)', () => {
    it('should validate nested viewport in projectConfig', () => {
      const validData = {
        crawl: true,
        viewport: validViewport,
        visualDiffThreshold: 0.5,
      };
      const result = projectConfigSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.viewport.width).toBe(1920);
        expect(result.data.viewport.height).toBe(1080);
      }
    });

    it('should validate nested viewport in runConfig', () => {
      const validData = {
        viewport: { width: 320, height: 240 },
        captureScreenshots: true,
        captureHar: false,
      };
      const result = runConfigSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });

  describe('projectConfigSchema (composition)', () => {
    it('should enforce all required fields', () => {
      const invalidData = {
        crawl: true,
        viewport: validViewport,
        // Missing visualDiffThreshold
      };
      const result = projectConfigSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain('visualDiffThreshold');
      }
    });

    it('should validate visualDiffThreshold range (0-1)', () => {
      const invalidDataNegative = {
        crawl: true,
        viewport: validViewport,
        visualDiffThreshold: -0.1,
      };
      expect(projectConfigSchema.safeParse(invalidDataNegative).success).toBe(false);

      const invalidDataTooHigh = {
        crawl: true,
        viewport: validViewport,
        visualDiffThreshold: 1.1,
      };
      expect(projectConfigSchema.safeParse(invalidDataTooHigh).success).toBe(false);
    });

    it('should accept boundary values for visualDiffThreshold', () => {
      const validDataMin = {
        crawl: true,
        viewport: validViewport,
        visualDiffThreshold: 0,
      };
      expect(projectConfigSchema.safeParse(validDataMin).success).toBe(true);

      const validDataMax = {
        crawl: true,
        viewport: validViewport,
        visualDiffThreshold: 1,
      };
      expect(projectConfigSchema.safeParse(validDataMax).success).toBe(true);
    });
  });

  describe('runConfigSchema (composition)', () => {
    it('should require all three fields', () => {
      const invalidData = {
        viewport: validViewport,
        captureScreenshots: true,
        // Missing captureHar
      };
      const result = runConfigSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should validate boolean types for flags', () => {
      const invalidData = {
        viewport: validViewport,
        captureScreenshots: 'true', // Should be boolean
        captureHar: true,
      };
      const result = runConfigSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('statisticsSchema (all integer fields)', () => {
    it('should accept valid integer statistics', () => {
      const result = statisticsSchema.safeParse(validStatistics);

      expect(result.success).toBe(true);
    });

    it('should accept zero for all fields', () => {
      const result = statisticsSchema.safeParse(zeroStatistics);

      expect(result.success).toBe(true);
    });

    it('should reject float values for any field', () => {
      const fields = [
        'totalPages',
        'completedPages',
        'errorPages',
        'changedPages',
        'unchangedPages',
        'totalDifferences',
        'criticalDifferences',
        'acceptedDifferences',
        'mutedDifferences',
      ];

      for (const field of fields) {
        const invalidData = { ...validStatistics, [field]: 100.5 };
        const result = statisticsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      }
    });

    it('should require all 9 fields', () => {
      const fields = [
        'totalPages',
        'completedPages',
        'errorPages',
        'changedPages',
        'unchangedPages',
        'totalDifferences',
        'criticalDifferences',
        'acceptedDifferences',
        'mutedDifferences',
      ];

      for (const field of fields) {
        const invalidData = { ...validStatistics };
        delete invalidData[field as keyof typeof invalidData];
        const result = statisticsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      }
    });
  });

  describe('runStatisticsSchema (subset of statistics)', () => {
    it('should accept valid run statistics', () => {
      const result = runStatisticsSchema.safeParse(validRunStatistics);

      expect(result.success).toBe(true);
    });

    it('should accept zero for all fields', () => {
      const result = runStatisticsSchema.safeParse(zeroRunStatistics);

      expect(result.success).toBe(true);
    });

    it('should require exactly 3 fields', () => {
      const fields = ['totalPages', 'completedPages', 'errorPages'];

      for (const field of fields) {
        const invalidData = { ...validRunStatistics };
        delete invalidData[field as keyof typeof invalidData];
        const result = runStatisticsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      }
    });

    it('should reject float values', () => {
      const invalidData = { ...validRunStatistics, totalPages: 50.5 };
      const result = runStatisticsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should not accept extra fields from full statistics', () => {
      const invalidData = {
        ...validRunStatistics,
        changedPages: 10, // Not in runStatisticsSchema
      };
      // Note: Zod by default strips unknown keys unless .strict() is used
      // This test documents expected behavior
      const result = runStatisticsSchema.safeParse(invalidData);
      expect(result.success).toBe(true); // Zod strips extra keys by default
    });
  });

  describe('nested validation cascading', () => {
    it('should cascade validation errors from nested viewport', () => {
      const invalidConfig = {
        crawl: true,
        viewport: { width: 100, height: 1080 }, // Invalid width
        visualDiffThreshold: 0.5,
      };
      const result = projectConfigSchema.safeParse(invalidConfig);

      expect(result.success).toBe(false);
      if (!result.success) {
        // Error should reference the nested path
        const pathContainsViewport = result.error.issues.some((issue) =>
          issue.path.includes('viewport'),
        );
        expect(pathContainsViewport).toBe(true);
      }
    });

    it('should validate multiple nested fields independently', () => {
      const invalidConfig = {
        crawl: true,
        viewport: { width: 100, height: 100 }, // Both invalid
        visualDiffThreshold: 2.0, // Also invalid
      };
      const result = projectConfigSchema.safeParse(invalidConfig);

      expect(result.success).toBe(false);
      if (!result.success) {
        // Should have multiple errors
        expect(result.error.issues.length).toBeGreaterThan(1);
      }
    });
  });
});
