/**
 * Response Schemas Tests
 * Tests for API response schemas
 */

import { describe, expect, it } from 'vitest';
import {
  createRunResponseSchema,
  createScanAsyncResponseSchema,
  errorResponseSchema,
  paginationSchema,
  projectConfigSchema,
  projectDetailsSchema,
  projectListItemSchema,
  runConfigSchema,
  runDetailsSchema,
  runPagesListSchema,
  runResponseSchema,
  runStatisticsSchema,
  statisticsSchema,
} from '../../src/api-contract.js';
import {
  validPagination,
  validProjectConfig,
  validRunConfig,
  validRunStatistics,
  validStatistics,
  validTimestamps,
  validURLs,
  validUUIDs,
  validViewport,
  zeroRunStatistics,
  zeroStatistics,
} from '../helpers/fixtures.js';

describe('Response Schemas', () => {
  describe('paginationSchema', () => {
    it('should accept valid pagination', () => {
      const result = paginationSchema.safeParse(validPagination);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(100);
        expect(result.data.limit).toBe(50);
        expect(result.data.offset).toBe(0);
        expect(result.data.hasMore).toBe(true);
      }
    });

    it('should accept zero values', () => {
      const validData = { total: 0, limit: 0, offset: 0, hasMore: false };
      const result = paginationSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const invalidData = { total: 100 };
      const result = paginationSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject non-integer total', () => {
      const invalidData = { total: 100.5, limit: 50, offset: 0, hasMore: true };
      const result = paginationSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('errorResponseSchema', () => {
    it('should accept valid error response', () => {
      const validData = {
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
        },
      };
      const result = errorResponseSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.error.code).toBe('NOT_FOUND');
        expect(result.data.error.message).toBe('Resource not found');
      }
    });

    it('should reject missing error object', () => {
      const invalidData = {};
      const result = errorResponseSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject missing code', () => {
      const invalidData = { error: { message: 'Error' } };
      const result = errorResponseSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject missing message', () => {
      const invalidData = { error: { code: 'ERROR' } };
      const result = errorResponseSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('projectConfigSchema', () => {
    it('should accept valid project config', () => {
      const result = projectConfigSchema.safeParse(validProjectConfig);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.crawl).toBe(true);
        expect(result.data.viewport.width).toBe(1920);
        expect(result.data.visualDiffThreshold).toBe(0.01);
      }
    });

    it('should accept config without maxPages (optional)', () => {
      const validData = {
        crawl: false,
        viewport: validViewport,
        visualDiffThreshold: 0.5,
      };
      const result = projectConfigSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const invalidData = { crawl: true };
      const result = projectConfigSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject invalid viewport', () => {
      const invalidData = {
        crawl: true,
        viewport: { width: 100, height: 1080 },
        visualDiffThreshold: 0.01,
      };
      const result = projectConfigSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject non-integer maxPages', () => {
      const invalidData = {
        crawl: true,
        viewport: validViewport,
        visualDiffThreshold: 0.01,
        maxPages: 100.5,
      };
      const result = projectConfigSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('statisticsSchema', () => {
    it('should accept valid statistics', () => {
      const result = statisticsSchema.safeParse(validStatistics);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalPages).toBe(100);
        expect(result.data.completedPages).toBe(95);
        expect(result.data.errorPages).toBe(5);
      }
    });

    it('should accept zero statistics', () => {
      const result = statisticsSchema.safeParse(zeroStatistics);

      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const invalidData = { totalPages: 100 };
      const result = statisticsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject non-integer values', () => {
      const invalidData = { ...validStatistics, totalPages: 100.5 };
      const result = statisticsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('projectListItemSchema', () => {
    it('should accept valid project list item', () => {
      const validData = {
        id: validUUIDs[0],
        name: 'Test Project',
        description: 'Test description',
        baseUrl: validURLs[0],
        status: 'completed',
        createdAt: validTimestamps[0],
        updatedAt: validTimestamps[1],
      };
      const result = projectListItemSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(validUUIDs[0]);
        expect(result.data.name).toBe('Test Project');
      }
    });

    it('should reject invalid UUID', () => {
      const invalidData = {
        id: 'not-a-uuid',
        name: 'Test',
        description: 'Test',
        baseUrl: validURLs[0],
        status: 'completed',
        createdAt: validTimestamps[0],
        updatedAt: validTimestamps[1],
      };
      const result = projectListItemSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject invalid URL', () => {
      const invalidData = {
        id: validUUIDs[0],
        name: 'Test',
        description: 'Test',
        baseUrl: 'not-a-url',
        status: 'completed',
        createdAt: validTimestamps[0],
        updatedAt: validTimestamps[1],
      };
      const result = projectListItemSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject invalid timestamp', () => {
      const invalidData = {
        id: validUUIDs[0],
        name: 'Test',
        description: 'Test',
        baseUrl: validURLs[0],
        status: 'completed',
        createdAt: 'not-a-timestamp',
        updatedAt: validTimestamps[1],
      };
      const result = projectListItemSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('projectDetailsSchema', () => {
    it('should accept valid project details', () => {
      const validData = {
        id: validUUIDs[0],
        name: 'Test Project',
        description: 'Test description',
        baseUrl: validURLs[0],
        config: validProjectConfig,
        status: 'completed',
        createdAt: validTimestamps[0],
        updatedAt: validTimestamps[1],
        statistics: validStatistics,
        pages: [],
        pagination: validPagination,
      };
      const result = projectDetailsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(validUUIDs[0]);
        expect(result.data.config.crawl).toBe(true);
        expect(result.data.statistics.totalPages).toBe(100);
      }
    });

    it('should reject invalid nested config', () => {
      const invalidData = {
        id: validUUIDs[0],
        name: 'Test',
        description: 'Test',
        baseUrl: validURLs[0],
        config: { crawl: true }, // Missing viewport
        status: 'completed',
        createdAt: validTimestamps[0],
        updatedAt: validTimestamps[1],
        statistics: validStatistics,
        pages: [],
        pagination: validPagination,
      };
      const result = projectDetailsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject invalid nested statistics', () => {
      const invalidData = {
        id: validUUIDs[0],
        name: 'Test',
        description: 'Test',
        baseUrl: validURLs[0],
        config: validProjectConfig,
        status: 'completed',
        createdAt: validTimestamps[0],
        updatedAt: validTimestamps[1],
        statistics: { totalPages: 100 }, // Missing required fields
        pages: [],
        pagination: validPagination,
      };
      const result = projectDetailsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('runConfigSchema', () => {
    it('should accept valid run config', () => {
      const result = runConfigSchema.safeParse(validRunConfig);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.viewport.width).toBe(1920);
        expect(result.data.captureScreenshots).toBe(true);
        expect(result.data.captureHar).toBe(true);
      }
    });

    it('should accept false for capture flags', () => {
      const validData = {
        viewport: validViewport,
        captureScreenshots: false,
        captureHar: false,
      };
      const result = runConfigSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const invalidData = { viewport: validViewport };
      const result = runConfigSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject invalid viewport', () => {
      const invalidData = {
        viewport: { width: 100, height: 1080 },
        captureScreenshots: true,
        captureHar: true,
      };
      const result = runConfigSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('runStatisticsSchema', () => {
    it('should accept valid run statistics', () => {
      const result = runStatisticsSchema.safeParse(validRunStatistics);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalPages).toBe(50);
        expect(result.data.completedPages).toBe(48);
        expect(result.data.errorPages).toBe(2);
      }
    });

    it('should accept zero statistics', () => {
      const result = runStatisticsSchema.safeParse(zeroRunStatistics);

      expect(result.success).toBe(true);
    });

    it('should reject non-integer values', () => {
      const invalidData = { ...validRunStatistics, totalPages: 50.5 };
      const result = runStatisticsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('runResponseSchema', () => {
    it('should accept valid run response', () => {
      const validData = {
        id: validUUIDs[0],
        projectId: validUUIDs[1],
        isBaseline: true,
        status: 'completed',
        createdAt: validTimestamps[0],
      };
      const result = runResponseSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(validUUIDs[0]);
        expect(result.data.isBaseline).toBe(true);
      }
    });

    it('should accept isBaseline: false', () => {
      const validData = {
        id: validUUIDs[0],
        projectId: validUUIDs[1],
        isBaseline: false,
        status: 'in_progress',
        createdAt: validTimestamps[0],
      };
      const result = runResponseSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const invalidData = {
        id: 'not-a-uuid',
        projectId: validUUIDs[1],
        isBaseline: true,
        status: 'completed',
        createdAt: validTimestamps[0],
      };
      const result = runResponseSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('runDetailsSchema', () => {
    it('should accept valid run details', () => {
      const validData = {
        id: validUUIDs[0],
        projectId: validUUIDs[1],
        isBaseline: false,
        status: 'completed',
        createdAt: validTimestamps[0],
        config: validRunConfig,
        statistics: validRunStatistics,
      };
      const result = runDetailsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.config.captureScreenshots).toBe(true);
        expect(result.data.statistics.totalPages).toBe(50);
      }
    });

    it('should reject invalid nested config', () => {
      const invalidData = {
        id: validUUIDs[0],
        projectId: validUUIDs[1],
        isBaseline: false,
        status: 'completed',
        createdAt: validTimestamps[0],
        config: { viewport: validViewport }, // Missing capture flags
        statistics: validRunStatistics,
      };
      const result = runDetailsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('createScanAsyncResponseSchema', () => {
    it('should accept valid async scan response', () => {
      const validData = {
        projectId: validUUIDs[0],
        status: 'PENDING',
        projectUrl: `/api/v1/projects/${validUUIDs[0]}`,
      };
      const result = createScanAsyncResponseSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.projectId).toBe(validUUIDs[0]);
        expect(result.data.status).toBe('PENDING');
      }
    });

    it('should reject invalid UUID', () => {
      const invalidData = {
        projectId: 'not-a-uuid',
        status: 'PENDING',
        projectUrl: '/api/v1/projects/123',
      };
      const result = createScanAsyncResponseSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('createRunResponseSchema', () => {
    it('should accept valid run response', () => {
      const validData = {
        runId: validUUIDs[0],
        status: 'PENDING',
        runUrl: `/api/v1/runs/${validUUIDs[0]}`,
      };
      const result = createRunResponseSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.runId).toBe(validUUIDs[0]);
        expect(result.data.status).toBe('PENDING');
      }
    });

    it('should reject invalid UUID', () => {
      const invalidData = {
        runId: 'not-a-uuid',
        status: 'PENDING',
        runUrl: '/api/v1/runs/123',
      };
      const result = createRunResponseSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('runPagesListSchema', () => {
    it('should accept valid run pages list', () => {
      const validData = {
        pages: [],
        pagination: validPagination,
      };
      const result = runPagesListSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pages).toEqual([]);
        expect(result.data.pagination.total).toBe(100);
      }
    });

    it('should reject missing required fields', () => {
      const invalidData = { pages: [] };
      const result = runPagesListSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject invalid pagination', () => {
      const invalidData = {
        pages: [],
        pagination: { total: 100 }, // Missing required pagination fields
      };
      const result = runPagesListSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });
});
