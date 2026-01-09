/**
 * Diff Schemas Tests
 * Tests for diff-related Zod schemas
 */

import { describe, expect, it } from 'vitest';
import { pageDiffSchema, taskStatusSchema } from '../../src/api-contract.js';
import { validTimestamps, validUUIDs } from '../helpers/fixtures.js';

describe('Diff Schemas', () => {
  describe('pageDiffSchema', () => {
    describe('valid data', () => {
      it('should accept valid page diff with no changes', () => {
        const validData = {
          pageId: validUUIDs[0],
          hasChanges: false,
          seoChanges: [],
          headerChanges: [],
          performanceChanges: [],
        };
        const result = pageDiffSchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.pageId).toBe(validUUIDs[0]);
          expect(result.data.hasChanges).toBe(false);
        }
      });

      it('should accept page diff with SEO changes', () => {
        const validData = {
          pageId: validUUIDs[0],
          hasChanges: true,
          seoChanges: [
            {
              field: 'title',
              baseline: 'Old Title',
              current: 'New Title',
            },
            {
              field: 'description',
              baseline: 'Old description',
              current: 'New description',
            },
          ],
          headerChanges: [],
          performanceChanges: [],
        };
        const result = pageDiffSchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.seoChanges).toHaveLength(2);
          expect(result.data.seoChanges[0]?.field).toBe('title');
        }
      });

      it('should accept SEO change with only baseline (deletion)', () => {
        const validData = {
          pageId: validUUIDs[0],
          hasChanges: true,
          seoChanges: [
            {
              field: 'description',
              baseline: 'Old description',
              // current is optional
            },
          ],
          headerChanges: [],
          performanceChanges: [],
        };
        const result = pageDiffSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept SEO change with only current (addition)', () => {
        const validData = {
          pageId: validUUIDs[0],
          hasChanges: true,
          seoChanges: [
            {
              field: 'canonical',
              // baseline is optional
              current: 'https://example.com/new',
            },
          ],
          headerChanges: [],
          performanceChanges: [],
        };
        const result = pageDiffSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept header changes', () => {
        const validData = {
          pageId: validUUIDs[0],
          hasChanges: true,
          seoChanges: [],
          headerChanges: [
            {
              header: 'content-type',
              baseline: 'text/html',
              current: 'text/html; charset=utf-8',
            },
          ],
          performanceChanges: [],
        };
        const result = pageDiffSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept performance changes', () => {
        const validData = {
          pageId: validUUIDs[0],
          hasChanges: true,
          seoChanges: [],
          headerChanges: [],
          performanceChanges: [
            {
              metric: 'loadTime',
              baseline: 1500,
              current: 2000,
            },
            {
              metric: 'requestCount',
              baseline: 50,
              current: 55,
            },
          ],
        };
        const result = pageDiffSchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.performanceChanges).toHaveLength(2);
        }
      });

      it('should accept all types of changes together', () => {
        const validData = {
          pageId: validUUIDs[0],
          hasChanges: true,
          seoChanges: [{ field: 'title', baseline: 'Old', current: 'New' }],
          headerChanges: [{ header: 'content-type', baseline: 'old', current: 'new' }],
          performanceChanges: [{ metric: 'loadTime', baseline: 1000, current: 1500 }],
        };
        const result = pageDiffSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });
    });

    describe('invalid data', () => {
      it('should reject missing pageId', () => {
        const invalidData = {
          hasChanges: false,
          seoChanges: [],
          headerChanges: [],
          performanceChanges: [],
        };
        const result = pageDiffSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject invalid UUID for pageId', () => {
        const invalidData = {
          pageId: 'not-a-uuid',
          hasChanges: false,
          seoChanges: [],
          headerChanges: [],
          performanceChanges: [],
        };
        const result = pageDiffSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject missing required arrays', () => {
        const invalidData = {
          pageId: validUUIDs[0],
          hasChanges: false,
        };
        const result = pageDiffSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject SEO change without field', () => {
        const invalidData = {
          pageId: validUUIDs[0],
          hasChanges: true,
          seoChanges: [
            {
              baseline: 'Old',
              current: 'New',
            },
          ],
          headerChanges: [],
          performanceChanges: [],
        };
        const result = pageDiffSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject header change without header name', () => {
        const invalidData = {
          pageId: validUUIDs[0],
          hasChanges: true,
          seoChanges: [],
          headerChanges: [
            {
              baseline: 'old',
              current: 'new',
            },
          ],
          performanceChanges: [],
        };
        const result = pageDiffSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject performance change without metric', () => {
        const invalidData = {
          pageId: validUUIDs[0],
          hasChanges: true,
          seoChanges: [],
          headerChanges: [],
          performanceChanges: [
            {
              baseline: 1000,
              current: 1500,
            },
          ],
        };
        const result = pageDiffSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });
    });
  });

  describe('taskStatusSchema', () => {
    describe('valid data', () => {
      it('should accept valid task with pending status', () => {
        const validData = {
          id: validUUIDs[0],
          type: 'scan',
          status: 'pending',
          createdAt: validTimestamps[0],
        };
        const result = taskStatusSchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe('pending');
        }
      });

      it('should accept all valid status values', () => {
        const statuses = ['pending', 'processing', 'completed', 'failed'] as const;

        for (const status of statuses) {
          const validData = {
            id: validUUIDs[0],
            type: 'scan',
            status,
            createdAt: validTimestamps[0],
          };
          const result = taskStatusSchema.safeParse(validData);
          expect(result.success).toBe(true);
        }
      });

      it('should accept task with all optional fields', () => {
        const validData = {
          id: validUUIDs[0],
          type: 'comparison',
          status: 'completed',
          createdAt: validTimestamps[0],
          startedAt: validTimestamps[1],
          completedAt: validTimestamps[2],
          attempts: 3,
          payload: { projectId: validUUIDs[1] },
        };
        const result = taskStatusSchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.attempts).toBe(3);
          expect(result.data.payload).toEqual({ projectId: validUUIDs[1] });
        }
      });

      it('should accept task with error message', () => {
        const validData = {
          id: validUUIDs[0],
          type: 'scan',
          status: 'failed',
          createdAt: validTimestamps[0],
          error: 'Timeout while crawling',
        };
        const result = taskStatusSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept attempts as integer', () => {
        const validData = {
          id: validUUIDs[0],
          type: 'scan',
          status: 'processing',
          createdAt: validTimestamps[0],
          attempts: 5,
        };
        const result = taskStatusSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept payload as any object', () => {
        const validData = {
          id: validUUIDs[0],
          type: 'scan',
          status: 'pending',
          createdAt: validTimestamps[0],
          payload: {
            url: 'https://example.com',
            depth: 3,
            config: { timeout: 5000 },
          },
        };
        const result = taskStatusSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });
    });

    describe('invalid data', () => {
      it('should reject missing required fields', () => {
        const invalidData = {
          id: validUUIDs[0],
          status: 'pending',
        };
        const result = taskStatusSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject invalid status enum value', () => {
        const invalidData = {
          id: validUUIDs[0],
          type: 'scan',
          status: 'unknown',
          createdAt: validTimestamps[0],
        };
        const result = taskStatusSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('status');
        }
      });

      it('should reject invalid UUID', () => {
        const invalidData = {
          id: 'not-a-uuid',
          type: 'scan',
          status: 'pending',
          createdAt: validTimestamps[0],
        };
        const result = taskStatusSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject invalid timestamp', () => {
        const invalidData = {
          id: validUUIDs[0],
          type: 'scan',
          status: 'pending',
          createdAt: 'not-a-timestamp',
        };
        const result = taskStatusSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject float for attempts (requires integer)', () => {
        const invalidData = {
          id: validUUIDs[0],
          type: 'scan',
          status: 'processing',
          createdAt: validTimestamps[0],
          attempts: 3.5,
        };
        const result = taskStatusSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject invalid timestamp for optional timestamp fields', () => {
        const invalidData = {
          id: validUUIDs[0],
          type: 'scan',
          status: 'completed',
          createdAt: validTimestamps[0],
          completedAt: 'invalid-timestamp',
        };
        const result = taskStatusSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });
    });
  });
});
