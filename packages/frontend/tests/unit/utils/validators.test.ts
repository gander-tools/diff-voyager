/**
 * Validators unit tests
 * Tests for Zod schemas used in project forms
 */

import { describe, expect, it } from 'vitest';
import { createProjectSchema } from '../../../src/utils/validators';

describe('validators', () => {
  describe('createProjectSchema', () => {
    describe('required fields', () => {
      it('should validate valid project data', () => {
        const validData = {
          name: 'Test Project',
          url: 'https://example.com',
          description: 'Test description',
          crawl: false,
          viewport: { width: 1920, height: 1080 },
          collectHar: false,
          waitAfterLoad: 1000,
          visualDiffThreshold: 0.01,
          maxPages: 100,
        };

        const result = createProjectSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should allow missing name field (optional)', () => {
        const validData = {
          url: 'https://example.com',
        };

        const result = createProjectSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should require url field', () => {
        const invalidData = {
          name: 'Test Project',
        };

        const result = createProjectSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('url');
        }
      });

      it('should allow empty name (optional field)', () => {
        const validData = {
          name: '',
          url: 'https://example.com',
        };

        const result = createProjectSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    describe('url validation', () => {
      it('should accept valid HTTP URL', () => {
        const data = {
          name: 'Test',
          url: 'http://example.com',
        };

        const result = createProjectSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept valid HTTPS URL', () => {
        const data = {
          name: 'Test',
          url: 'https://example.com',
        };

        const result = createProjectSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject invalid URL format', () => {
        const data = {
          name: 'Test',
          url: 'not-a-valid-url',
        };

        const result = createProjectSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject relative URLs', () => {
        const data = {
          name: 'Test',
          url: '/relative/path',
        };

        const result = createProjectSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('name validation', () => {
      it('should accept name within length limits', () => {
        const data = {
          name: 'A'.repeat(100),
          url: 'https://example.com',
        };

        const result = createProjectSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject name exceeding max length', () => {
        const data = {
          name: 'A'.repeat(101),
          url: 'https://example.com',
        };

        const result = createProjectSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should trim whitespace from name', () => {
        const data = {
          name: '  Test Project  ',
          url: 'https://example.com',
        };

        const result = createProjectSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe('Test Project');
        }
      });
    });

    describe('description validation', () => {
      it('should accept optional description', () => {
        const data = {
          name: 'Test',
          url: 'https://example.com',
          description: 'Test description',
        };

        const result = createProjectSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should allow missing description', () => {
        const data = {
          name: 'Test',
          url: 'https://example.com',
        };

        const result = createProjectSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject description exceeding max length', () => {
        const data = {
          name: 'Test',
          url: 'https://example.com',
          description: 'A'.repeat(501),
        };

        const result = createProjectSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('viewport validation', () => {
      it('should use default viewport when not provided', () => {
        const data = {
          name: 'Test',
          url: 'https://example.com',
        };

        const result = createProjectSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.viewport).toEqual({ width: 1920, height: 1080 });
        }
      });

      it('should accept valid viewport dimensions', () => {
        const data = {
          name: 'Test',
          url: 'https://example.com',
          viewport: { width: 1920, height: 1080 },
        };

        const result = createProjectSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject viewport width below minimum', () => {
        const data = {
          name: 'Test',
          url: 'https://example.com',
          viewport: { width: 319, height: 1080 },
        };

        const result = createProjectSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject viewport width above maximum', () => {
        const data = {
          name: 'Test',
          url: 'https://example.com',
          viewport: { width: 3841, height: 1080 },
        };

        const result = createProjectSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject viewport height below minimum', () => {
        const data = {
          name: 'Test',
          url: 'https://example.com',
          viewport: { width: 1920, height: 239 },
        };

        const result = createProjectSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject viewport height above maximum', () => {
        const data = {
          name: 'Test',
          url: 'https://example.com',
          viewport: { width: 1920, height: 2161 },
        };

        const result = createProjectSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('boolean fields with defaults', () => {
      it('should default crawl to false', () => {
        const data = {
          name: 'Test',
          url: 'https://example.com',
        };

        const result = createProjectSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.crawl).toBe(false);
        }
      });

      it('should default collectHar to false', () => {
        const data = {
          name: 'Test',
          url: 'https://example.com',
        };

        const result = createProjectSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.collectHar).toBe(false);
        }
      });

      it('should accept crawl as true', () => {
        const data = {
          name: 'Test',
          url: 'https://example.com',
          crawl: true,
        };

        const result = createProjectSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.crawl).toBe(true);
        }
      });
    });

    describe('numeric fields', () => {
      it('should default waitAfterLoad to 1000', () => {
        const data = {
          name: 'Test',
          url: 'https://example.com',
        };

        const result = createProjectSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.waitAfterLoad).toBe(1000);
        }
      });

      it('should default visualDiffThreshold to 0.01', () => {
        const data = {
          name: 'Test',
          url: 'https://example.com',
        };

        const result = createProjectSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.visualDiffThreshold).toBe(0.01);
        }
      });

      it('should reject waitAfterLoad below minimum', () => {
        const data = {
          name: 'Test',
          url: 'https://example.com',
          waitAfterLoad: -1,
        };

        const result = createProjectSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject waitAfterLoad above maximum', () => {
        const data = {
          name: 'Test',
          url: 'https://example.com',
          waitAfterLoad: 30001,
        };

        const result = createProjectSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject visualDiffThreshold below minimum', () => {
        const data = {
          name: 'Test',
          url: 'https://example.com',
          visualDiffThreshold: -0.01,
        };

        const result = createProjectSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject visualDiffThreshold above maximum', () => {
        const data = {
          name: 'Test',
          url: 'https://example.com',
          visualDiffThreshold: 1.01,
        };

        const result = createProjectSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept maxPages as undefined', () => {
        const data = {
          name: 'Test',
          url: 'https://example.com',
        };

        const result = createProjectSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.maxPages).toBeUndefined();
        }
      });

      it('should accept valid maxPages value', () => {
        const data = {
          name: 'Test',
          url: 'https://example.com',
          maxPages: 100,
        };

        const result = createProjectSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject maxPages below minimum', () => {
        const data = {
          name: 'Test',
          url: 'https://example.com',
          maxPages: 0,
        };

        const result = createProjectSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });
});
