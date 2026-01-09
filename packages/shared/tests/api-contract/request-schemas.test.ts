/**
 * Request Schemas Tests
 * Tests for POST request body schemas
 */

import { describe, expect, it } from 'vitest';
import {
  createRunBodySchema,
  createScanBodySchema,
  viewportSchema,
} from '../../src/api-contract.js';
import {
  invalidURLs,
  invalidViewports,
  validURLs,
  validViewport,
  validViewports,
} from '../helpers/fixtures.js';

describe('Request Schemas', () => {
  describe('viewportSchema', () => {
    describe('valid data', () => {
      it('should accept valid viewport dimensions', () => {
        const result = viewportSchema.safeParse(validViewport);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.width).toBe(1920);
          expect(result.data.height).toBe(1080);
        }
      });

      it('should accept minimum viewport dimensions (320x240)', () => {
        const validData = { width: 320, height: 240 };
        const result = viewportSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept 4K viewport (3840x2160)', () => {
        const validData = { width: 3840, height: 2160 };
        const result = viewportSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept all valid viewport configurations', () => {
        for (const viewport of validViewports) {
          const result = viewportSchema.safeParse(viewport);
          expect(result.success).toBe(true);
        }
      });
    });

    describe('invalid data', () => {
      it('should reject width less than 320', () => {
        const invalidData = { width: 319, height: 1080 };
        const result = viewportSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('width');
        }
      });

      it('should reject height less than 240', () => {
        const invalidData = { width: 1920, height: 239 };
        const result = viewportSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('height');
        }
      });

      it('should reject negative width', () => {
        const invalidData = { width: -1920, height: 1080 };
        const result = viewportSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject negative height', () => {
        const invalidData = { width: 1920, height: -1080 };
        const result = viewportSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject float width (requires integer)', () => {
        const invalidData = { width: 1920.5, height: 1080 };
        const result = viewportSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject float height (requires integer)', () => {
        const invalidData = { width: 1920, height: 1080.5 };
        const result = viewportSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject missing width', () => {
        const invalidData = { height: 1080 };
        const result = viewportSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject missing height', () => {
        const invalidData = { width: 1920 };
        const result = viewportSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject all invalid viewport configurations', () => {
        for (const viewport of invalidViewports) {
          const result = viewportSchema.safeParse(viewport);
          expect(result.success).toBe(false);
        }
      });
    });
  });

  describe('createScanBodySchema', () => {
    describe('valid data', () => {
      it('should accept minimal valid scan request (only url)', () => {
        const validData = { url: validURLs[0] };
        const result = createScanBodySchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.url).toBe(validURLs[0]);
        }
      });

      it('should accept all optional fields', () => {
        const validData = {
          url: 'https://example.com',
          sync: true,
          name: 'Test Scan',
          description: 'Test description',
          crawl: true,
          maxPages: 100,
          viewport: validViewport,
          collectHar: true,
          waitAfterLoad: 1000,
          visualDiffThreshold: 0.01,
        };
        const result = createScanBodySchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.url).toBe('https://example.com');
          expect(result.data.sync).toBe(true);
          expect(result.data.name).toBe('Test Scan');
          expect(result.data.maxPages).toBe(100);
          expect(result.data.visualDiffThreshold).toBe(0.01);
        }
      });

      it('should accept sync: false', () => {
        const validData = { url: 'https://example.com', sync: false };
        const result = createScanBodySchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept crawl: false', () => {
        const validData = { url: 'https://example.com', crawl: false };
        const result = createScanBodySchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept maxPages as positive integer', () => {
        const validData = { url: 'https://example.com', maxPages: 500 };
        const result = createScanBodySchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept waitAfterLoad: 0 (minimum)', () => {
        const validData = { url: 'https://example.com', waitAfterLoad: 0 };
        const result = createScanBodySchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept visualDiffThreshold: 0 (minimum)', () => {
        const validData = { url: 'https://example.com', visualDiffThreshold: 0 };
        const result = createScanBodySchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept visualDiffThreshold: 1 (maximum)', () => {
        const validData = { url: 'https://example.com', visualDiffThreshold: 1 };
        const result = createScanBodySchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept nested viewport', () => {
        const validData = {
          url: 'https://example.com',
          viewport: { width: 1366, height: 768 },
        };
        const result = createScanBodySchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.viewport?.width).toBe(1366);
        }
      });
    });

    describe('invalid data', () => {
      it('should reject missing url', () => {
        const invalidData = {};
        const result = createScanBodySchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('url');
        }
      });

      it('should reject invalid URL', () => {
        for (const invalidURL of invalidURLs) {
          const result = createScanBodySchema.safeParse({ url: invalidURL });
          expect(result.success).toBe(false);
        }
      });

      it('should reject maxPages: 0 (must be positive)', () => {
        const invalidData = { url: 'https://example.com', maxPages: 0 };
        const result = createScanBodySchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('maxPages');
        }
      });

      it('should reject negative maxPages', () => {
        const invalidData = { url: 'https://example.com', maxPages: -10 };
        const result = createScanBodySchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject float maxPages (requires integer)', () => {
        const invalidData = { url: 'https://example.com', maxPages: 100.5 };
        const result = createScanBodySchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject negative waitAfterLoad', () => {
        const invalidData = { url: 'https://example.com', waitAfterLoad: -1 };
        const result = createScanBodySchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('waitAfterLoad');
        }
      });

      it('should reject float waitAfterLoad (requires integer)', () => {
        const invalidData = { url: 'https://example.com', waitAfterLoad: 1000.5 };
        const result = createScanBodySchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject visualDiffThreshold less than 0', () => {
        const invalidData = { url: 'https://example.com', visualDiffThreshold: -0.01 };
        const result = createScanBodySchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('visualDiffThreshold');
        }
      });

      it('should reject visualDiffThreshold greater than 1', () => {
        const invalidData = { url: 'https://example.com', visualDiffThreshold: 1.01 };
        const result = createScanBodySchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('visualDiffThreshold');
        }
      });

      it('should reject invalid nested viewport', () => {
        const invalidData = {
          url: 'https://example.com',
          viewport: { width: 100, height: 1080 }, // Width too small
        };
        const result = createScanBodySchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });
    });
  });

  describe('createRunBodySchema', () => {
    describe('valid data', () => {
      it('should accept minimal valid run request (only url)', () => {
        const validData = { url: validURLs[0] };
        const result = createRunBodySchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.url).toBe(validURLs[0]);
        }
      });

      it('should accept all optional fields', () => {
        const validData = {
          url: 'https://example.com',
          viewport: validViewport,
          collectHar: true,
          waitAfterLoad: 2000,
        };
        const result = createRunBodySchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.url).toBe('https://example.com');
          expect(result.data.collectHar).toBe(true);
          expect(result.data.waitAfterLoad).toBe(2000);
        }
      });

      it('should accept collectHar: false', () => {
        const validData = { url: 'https://example.com', collectHar: false };
        const result = createRunBodySchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept waitAfterLoad: 0', () => {
        const validData = { url: 'https://example.com', waitAfterLoad: 0 };
        const result = createRunBodySchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept nested viewport', () => {
        const validData = {
          url: 'https://example.com',
          viewport: { width: 320, height: 240 },
        };
        const result = createRunBodySchema.safeParse(validData);

        expect(result.success).toBe(true);
      });
    });

    describe('invalid data', () => {
      it('should reject missing url', () => {
        const invalidData = {};
        const result = createRunBodySchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('url');
        }
      });

      it('should reject invalid URL', () => {
        for (const invalidURL of invalidURLs) {
          const result = createRunBodySchema.safeParse({ url: invalidURL });
          expect(result.success).toBe(false);
        }
      });

      it('should reject negative waitAfterLoad', () => {
        const invalidData = { url: 'https://example.com', waitAfterLoad: -1 };
        const result = createRunBodySchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject float waitAfterLoad', () => {
        const invalidData = { url: 'https://example.com', waitAfterLoad: 500.5 };
        const result = createRunBodySchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject invalid nested viewport', () => {
        const invalidData = {
          url: 'https://example.com',
          viewport: { width: 1920, height: 100 }, // Height too small
        };
        const result = createRunBodySchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });
    });
  });
});
