import { describe, it, expect } from 'vitest';
import { PageModel } from './Page.js';

describe('PageModel', () => {
  describe('create', () => {
    it('should create a new page with valid data', () => {
      const page = PageModel.create({
        projectId: 'project-123',
        originalUrl: 'https://example.com/page?param=1',
        normalizedUrl: 'https://example.com/page',
      });

      expect(page.id).toBeDefined();
      expect(page.projectId).toBe('project-123');
      expect(page.originalUrl).toBe('https://example.com/page?param=1');
      expect(page.normalizedUrl).toBe('https://example.com/page');
      expect(page.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error if projectId is empty', () => {
      expect(() =>
        PageModel.create({
          projectId: '',
          originalUrl: 'https://example.com/page',
          normalizedUrl: 'https://example.com/page',
        }),
      ).toThrow('Project ID cannot be empty');
    });

    it('should throw error if originalUrl is empty', () => {
      expect(() =>
        PageModel.create({
          projectId: 'project-123',
          originalUrl: '',
          normalizedUrl: 'https://example.com/page',
        }),
      ).toThrow('Original URL cannot be empty');
    });

    it('should throw error if normalizedUrl is empty', () => {
      expect(() =>
        PageModel.create({
          projectId: 'project-123',
          originalUrl: 'https://example.com/page',
          normalizedUrl: '',
        }),
      ).toThrow('Normalized URL cannot be empty');
    });

    it('should throw error if originalUrl is invalid', () => {
      expect(() =>
        PageModel.create({
          projectId: 'project-123',
          originalUrl: 'not-a-url',
          normalizedUrl: 'https://example.com/page',
        }),
      ).toThrow('Original URL must be a valid URL');
    });

    it('should throw error if normalizedUrl is invalid', () => {
      expect(() =>
        PageModel.create({
          projectId: 'project-123',
          originalUrl: 'https://example.com/page',
          normalizedUrl: 'not-a-url',
        }),
      ).toThrow('Normalized URL must be a valid URL');
    });
  });

  describe('normalizeUrl', () => {
    it('should remove trailing slash', () => {
      const normalized = PageModel.normalizeUrl('https://example.com/page/');
      expect(normalized).toBe('https://example.com/page');
    });

    it('should remove query parameters', () => {
      const normalized = PageModel.normalizeUrl(
        'https://example.com/page?param=1&other=2',
      );
      expect(normalized).toBe('https://example.com/page');
    });

    it('should remove fragment/hash', () => {
      const normalized = PageModel.normalizeUrl(
        'https://example.com/page#section',
      );
      expect(normalized).toBe('https://example.com/page');
    });

    it('should convert to lowercase', () => {
      const normalized = PageModel.normalizeUrl('https://example.com/PAGE');
      expect(normalized).toBe('https://example.com/page');
    });

    it('should preserve protocol', () => {
      const httpNormalized = PageModel.normalizeUrl('http://example.com/page');
      const httpsNormalized = PageModel.normalizeUrl('https://example.com/page');

      expect(httpNormalized).toBe('http://example.com/page');
      expect(httpsNormalized).toBe('https://example.com/page');
    });

    it('should handle root URL', () => {
      const normalized = PageModel.normalizeUrl('https://example.com/');
      expect(normalized).toBe('https://example.com');
    });

    it('should throw error for invalid URL', () => {
      expect(() => PageModel.normalizeUrl('not-a-url')).toThrow(
        'Invalid URL',
      );
    });
  });

  describe('toJSON', () => {
    it('should serialize page to JSON', () => {
      const page = PageModel.create({
        projectId: 'project-123',
        originalUrl: 'https://example.com/page?param=1',
        normalizedUrl: 'https://example.com/page',
      });

      const json = PageModel.toJSON(page);

      expect(json.id).toBe(page.id);
      expect(json.projectId).toBe('project-123');
      expect(json.originalUrl).toBe('https://example.com/page?param=1');
      expect(json.normalizedUrl).toBe('https://example.com/page');
      expect(json.createdAt).toBe(page.createdAt.toISOString());
    });
  });

  describe('fromJSON', () => {
    it('should deserialize page from JSON', () => {
      const json = {
        id: 'page-123',
        projectId: 'project-456',
        originalUrl: 'https://example.com/page?param=1',
        normalizedUrl: 'https://example.com/page',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      const page = PageModel.fromJSON(json);

      expect(page.id).toBe('page-123');
      expect(page.projectId).toBe('project-456');
      expect(page.originalUrl).toBe('https://example.com/page?param=1');
      expect(page.normalizedUrl).toBe('https://example.com/page');
      expect(page.createdAt).toBeInstanceOf(Date);
      expect(page.createdAt.toISOString()).toBe('2024-01-01T00:00:00.000Z');
    });
  });
});
