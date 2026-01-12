/**
 * Query Schemas Tests
 * Tests for query parameter Zod schemas with type coercion (z.coerce)
 * Query parameters come as strings from URLs, so coercion is critical
 */

import { describe, expect, it } from 'vitest';
import {
  getProjectQuerySchema,
  listProjectsQuerySchema,
  listRunPagesQuerySchema,
  listRunsQuerySchema,
} from '../../src/api-contract.js';

describe('Query Schemas', () => {
  describe('getProjectQuerySchema', () => {
    describe('valid data', () => {
      it('should accept empty query (all optional)', () => {
        const validData = {};
        const result = getProjectQuerySchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept includePages as boolean true', () => {
        const validData = { includePages: true };
        const result = getProjectQuerySchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.includePages).toBe(true);
        }
      });

      it('should accept includePages as boolean false', () => {
        const validData = { includePages: false };
        const result = getProjectQuerySchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.includePages).toBe(false);
        }
      });

      it('should coerce string "true" to boolean true', () => {
        const validData = { includePages: 'true' };
        const result = getProjectQuerySchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.includePages).toBe(true);
          expect(typeof result.data.includePages).toBe('boolean');
        }
      });

      it('should transform string "false" to boolean false (explicit string parsing)', () => {
        // Note: Uses z.enum(['true', 'false']).transform() for explicit string parsing
        // String "false" correctly becomes boolean false
        const validData = { includePages: 'false' };
        const result = getProjectQuerySchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.includePages).toBe(false);
          expect(typeof result.data.includePages).toBe('boolean');
        }
      });

      it('should accept pageLimit as number', () => {
        const validData = { pageLimit: 50 };
        const result = getProjectQuerySchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.pageLimit).toBe(50);
        }
      });

      it('should coerce string "50" to number 50', () => {
        const validData = { pageLimit: '50' };
        const result = getProjectQuerySchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.pageLimit).toBe(50);
          expect(typeof result.data.pageLimit).toBe('number');
        }
      });

      it('should accept pageOffset as number', () => {
        const validData = { pageOffset: 0 };
        const result = getProjectQuerySchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.pageOffset).toBe(0);
        }
      });

      it('should coerce string "100" to number 100', () => {
        const validData = { pageOffset: '100' };
        const result = getProjectQuerySchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.pageOffset).toBe(100);
          expect(typeof result.data.pageOffset).toBe('number');
        }
      });

      it('should accept all query parameters together', () => {
        const validData = {
          includePages: 'true',
          pageLimit: '50',
          pageOffset: '10',
        };
        const result = getProjectQuerySchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.includePages).toBe(true);
          expect(result.data.pageLimit).toBe(50);
          expect(result.data.pageOffset).toBe(10);
        }
      });
    });

    describe('invalid data', () => {
      it('should reject pageLimit less than 1', () => {
        const invalidData = { pageLimit: 0 };
        const result = getProjectQuerySchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('pageLimit');
        }
      });

      it('should reject negative pageLimit', () => {
        const invalidData = { pageLimit: -1 };
        const result = getProjectQuerySchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject negative pageOffset', () => {
        const invalidData = { pageOffset: -1 };
        const result = getProjectQuerySchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('pageOffset');
        }
      });

      it('should reject non-numeric string for pageLimit', () => {
        const invalidData = { pageLimit: 'abc' };
        const result = getProjectQuerySchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject float for pageLimit (requires int)', () => {
        const invalidData = { pageLimit: 50.5 };
        const result = getProjectQuerySchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });
    });
  });

  describe('listProjectsQuerySchema', () => {
    describe('valid data', () => {
      it('should accept empty query (all optional)', () => {
        const validData = {};
        const result = listProjectsQuerySchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept limit as number', () => {
        const validData = { limit: 50 };
        const result = listProjectsQuerySchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(50);
        }
      });

      it('should coerce string "50" to number 50', () => {
        const validData = { limit: '50' };
        const result = listProjectsQuerySchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(50);
          expect(typeof result.data.limit).toBe('number');
        }
      });

      it('should accept offset as number', () => {
        const validData = { offset: 0 };
        const result = listProjectsQuerySchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.offset).toBe(0);
        }
      });

      it('should coerce string "100" to number 100', () => {
        const validData = { offset: '100' };
        const result = listProjectsQuerySchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.offset).toBe(100);
        }
      });

      it('should accept minimum limit (1)', () => {
        const validData = { limit: 1 };
        const result = listProjectsQuerySchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept maximum limit (100)', () => {
        const validData = { limit: 100 };
        const result = listProjectsQuerySchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept both limit and offset', () => {
        const validData = { limit: '50', offset: '10' };
        const result = listProjectsQuerySchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(50);
          expect(result.data.offset).toBe(10);
        }
      });
    });

    describe('invalid data', () => {
      it('should reject limit less than 1', () => {
        const invalidData = { limit: 0 };
        const result = listProjectsQuerySchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('limit');
        }
      });

      it('should reject limit greater than 100', () => {
        const invalidData = { limit: 101 };
        const result = listProjectsQuerySchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('limit');
        }
      });

      it('should reject negative limit', () => {
        const invalidData = { limit: -1 };
        const result = listProjectsQuerySchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject negative offset', () => {
        const invalidData = { offset: -1 };
        const result = listProjectsQuerySchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('offset');
        }
      });

      it('should reject float for limit (requires int)', () => {
        const invalidData = { limit: 50.5 };
        const result = listProjectsQuerySchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject non-numeric string for limit', () => {
        const invalidData = { limit: 'abc' };
        const result = listProjectsQuerySchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });
    });
  });

  describe('listRunsQuerySchema', () => {
    it('should have same structure as listProjectsQuerySchema', () => {
      const validData = { limit: '50', offset: '10' };
      const result = listRunsQuerySchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
        expect(result.data.offset).toBe(10);
      }
    });

    it('should reject limit greater than 100', () => {
      const invalidData = { limit: 101 };
      const result = listRunsQuerySchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should accept minimum and maximum values', () => {
      const validDataMin = { limit: 1, offset: 0 };
      const validDataMax = { limit: 100, offset: 1000 };

      expect(listRunsQuerySchema.safeParse(validDataMin).success).toBe(true);
      expect(listRunsQuerySchema.safeParse(validDataMax).success).toBe(true);
    });
  });

  describe('listRunPagesQuerySchema', () => {
    describe('valid data', () => {
      it('should accept empty query (all optional)', () => {
        const validData = {};
        const result = listRunPagesQuerySchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept limit and offset', () => {
        const validData = { limit: '50', offset: '10' };
        const result = listRunPagesQuerySchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(50);
          expect(result.data.offset).toBe(10);
        }
      });

      it('should accept status filter', () => {
        const validData = { status: 'completed' };
        const result = listRunPagesQuerySchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe('completed');
        }
      });

      it('should accept all parameters together', () => {
        const validData = { limit: '20', offset: '5', status: 'error' };
        const result = listRunPagesQuerySchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(20);
          expect(result.data.offset).toBe(5);
          expect(result.data.status).toBe('error');
        }
      });
    });

    describe('invalid data', () => {
      it('should reject limit greater than 100', () => {
        const invalidData = { limit: 101 };
        const result = listRunPagesQuerySchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject negative offset', () => {
        const invalidData = { offset: -1 };
        const result = listRunPagesQuerySchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });
    });
  });
});
