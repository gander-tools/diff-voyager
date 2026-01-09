/**
 * Common Schemas Tests
 * Tests for primitive Zod schemas used across all API contract schemas
 */

import { describe, expect, it } from 'vitest';
import { timestampSchema, urlSchema, uuidSchema } from '../../src/api-contract.js';
import {
  invalidTimestamps,
  invalidURLs,
  invalidUUIDs,
  validTimestamps,
  validURLs,
  validUUIDs,
} from '../helpers/fixtures.js';

describe('Common Schemas', () => {
  describe('uuidSchema', () => {
    describe('valid data', () => {
      it('should accept valid UUID v4 format', () => {
        const validData = validUUIDs[0];
        const result = uuidSchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(validData);
        }
      });

      it('should accept multiple valid UUID formats', () => {
        for (const uuid of validUUIDs) {
          const result = uuidSchema.safeParse(uuid);
          expect(result.success).toBe(true);
        }
      });
    });

    describe('invalid data', () => {
      it('should reject non-UUID string', () => {
        const invalidData = 'not-a-uuid';
        const result = uuidSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('Invalid uuid');
        }
      });

      it('should reject empty string', () => {
        const invalidData = '';
        const result = uuidSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject UUID with wrong format (missing hyphens)', () => {
        const invalidData = '550e8400e29b41d4a716446655440000';
        const result = uuidSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject UUID that is too short', () => {
        const invalidData = '550e8400-e29b-41d4-a716';
        const result = uuidSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject all invalid UUID formats', () => {
        for (const uuid of invalidUUIDs) {
          const result = uuidSchema.safeParse(uuid);
          expect(result.success).toBe(false);
        }
      });
    });
  });

  describe('urlSchema', () => {
    describe('valid data', () => {
      it('should accept valid https URL', () => {
        const validData = 'https://example.com';
        const result = urlSchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(validData);
        }
      });

      it('should accept valid http URL', () => {
        const validData = 'http://example.com';
        const result = urlSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept URL with path', () => {
        const validData = 'https://example.com/path';
        const result = urlSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept URL with query parameters', () => {
        const validData = 'https://example.com/path?query=value';
        const result = urlSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept URL with subdomain', () => {
        const validData = 'https://subdomain.example.com';
        const result = urlSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept URL with port', () => {
        const validData = 'https://example.com:8080';
        const result = urlSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept all valid URL formats', () => {
        for (const url of validURLs) {
          const result = urlSchema.safeParse(url);
          expect(result.success).toBe(true);
        }
      });
    });

    describe('invalid data', () => {
      it('should reject non-URL string', () => {
        const invalidData = 'not-a-url';
        const result = urlSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('Invalid url');
        }
      });

      it('should reject empty string', () => {
        const invalidData = '';
        const result = urlSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject relative path', () => {
        const invalidData = '/relative/path';
        const result = urlSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject URL without protocol', () => {
        const invalidData = 'example.com';
        const result = urlSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject protocol-relative URL', () => {
        const invalidData = '//example.com';
        const result = urlSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject all invalid URL formats', () => {
        for (const url of invalidURLs) {
          const result = urlSchema.safeParse(url);
          expect(result.success).toBe(false);
        }
      });
    });
  });

  describe('timestampSchema', () => {
    describe('valid data', () => {
      it('should accept valid ISO 8601 timestamp', () => {
        const validData = '2024-01-01T00:00:00.000Z';
        const result = timestampSchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(validData);
        }
      });

      it('should accept timestamp with milliseconds', () => {
        const validData = '2024-06-15T12:30:45.123Z';
        const result = timestampSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept timestamp without milliseconds', () => {
        const validData = '2026-01-09T10:00:00Z';
        const result = timestampSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept all valid timestamp formats', () => {
        for (const timestamp of validTimestamps) {
          const result = timestampSchema.safeParse(timestamp);
          expect(result.success).toBe(true);
        }
      });
    });

    describe('invalid data', () => {
      it('should reject non-datetime string', () => {
        const invalidData = 'not-a-date';
        const result = timestampSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('Invalid datetime');
        }
      });

      it('should reject empty string', () => {
        const invalidData = '';
        const result = timestampSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject date without time', () => {
        const invalidData = '2024-01-01';
        const result = timestampSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject US date format', () => {
        const invalidData = '01/01/2024';
        const result = timestampSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject invalid month', () => {
        const invalidData = '2024-13-01T00:00:00Z';
        const result = timestampSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject invalid day', () => {
        const invalidData = '2024-01-32T00:00:00Z';
        const result = timestampSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject all invalid timestamp formats', () => {
        for (const timestamp of invalidTimestamps) {
          const result = timestampSchema.safeParse(timestamp);
          expect(result.success).toBe(false);
        }
      });
    });
  });
});
