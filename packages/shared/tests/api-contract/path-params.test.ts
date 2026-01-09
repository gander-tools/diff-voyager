/**
 * Path Parameters Tests
 * Tests for path parameter schemas (all UUID validation)
 */

import { describe, expect, it } from 'vitest';
import {
  pageIdParamSchema,
  projectIdParamSchema,
  runIdParamSchema,
  taskIdParamSchema,
} from '../../src/api-contract.js';
import { invalidUUIDs, validUUIDs } from '../helpers/fixtures.js';

describe('Path Parameters Schemas', () => {
  describe('projectIdParamSchema', () => {
    it('should accept valid project ID', () => {
      const validData = { projectId: validUUIDs[0] };
      const result = projectIdParamSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.projectId).toBe(validUUIDs[0]);
      }
    });

    it('should reject invalid UUID for projectId', () => {
      const invalidData = { projectId: 'not-a-uuid' };
      const result = projectIdParamSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain('projectId');
      }
    });

    it('should reject missing projectId', () => {
      const invalidData = {};
      const result = projectIdParamSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject all invalid UUIDs', () => {
      for (const invalidUUID of invalidUUIDs) {
        const result = projectIdParamSchema.safeParse({ projectId: invalidUUID });
        expect(result.success).toBe(false);
      }
    });
  });

  describe('runIdParamSchema', () => {
    it('should accept valid run ID', () => {
      const validData = { runId: validUUIDs[1] };
      const result = runIdParamSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.runId).toBe(validUUIDs[1]);
      }
    });

    it('should reject invalid UUID for runId', () => {
      const invalidData = { runId: 'not-a-uuid' };
      const result = runIdParamSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain('runId');
      }
    });

    it('should reject missing runId', () => {
      const invalidData = {};
      const result = runIdParamSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('pageIdParamSchema', () => {
    it('should accept valid page ID', () => {
      const validData = { pageId: validUUIDs[2] };
      const result = pageIdParamSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pageId).toBe(validUUIDs[2]);
      }
    });

    it('should reject invalid UUID for pageId', () => {
      const invalidData = { pageId: 'not-a-uuid' };
      const result = pageIdParamSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain('pageId');
      }
    });

    it('should reject missing pageId', () => {
      const invalidData = {};
      const result = pageIdParamSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('taskIdParamSchema', () => {
    it('should accept valid task ID', () => {
      const validData = { taskId: validUUIDs[3] };
      const result = taskIdParamSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.taskId).toBe(validUUIDs[3]);
      }
    });

    it('should reject invalid UUID for taskId', () => {
      const invalidData = { taskId: 'not-a-uuid' };
      const result = taskIdParamSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain('taskId');
      }
    });

    it('should reject missing taskId', () => {
      const invalidData = {};
      const result = taskIdParamSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });
});
