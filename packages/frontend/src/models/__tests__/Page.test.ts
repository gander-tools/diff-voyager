import { describe, it, expect, beforeEach } from 'vitest';
import { PageModel } from '../Page';
import type { Page } from '@gander-tools/diff-voyager-shared';

describe('PageModel', () => {
  let mockPage: Page;

  beforeEach(() => {
    mockPage = {
      id: 'page-1',
      projectId: 'project-1',
      normalizedUrl: 'https://example.com/page',
      originalUrl: 'https://example.com/page?utm_source=test',
      createdAt: new Date('2024-01-01T00:00:00Z'),
    };
  });

  describe('constructor', () => {
    it('should create a PageModel instance from Page data', () => {
      const model = new PageModel(mockPage);

      expect(model.id).toBe('page-1');
      expect(model.projectId).toBe('project-1');
      expect(model.normalizedUrl).toBe('https://example.com/page');
      expect(model.originalUrl).toBe('https://example.com/page?utm_source=test');
      expect(model.createdAt).toEqual(new Date('2024-01-01T00:00:00Z'));
    });
  });

  describe('create', () => {
    it('should create a new page with generated ID', () => {
      const newPage = PageModel.create({
        projectId: 'project-2',
        normalizedUrl: 'https://example.com/about',
        originalUrl: 'https://example.com/about?ref=home',
      });

      expect(newPage.id).toBeDefined();
      expect(newPage.id).toMatch(/^page-/);
      expect(newPage.projectId).toBe('project-2');
      expect(newPage.normalizedUrl).toBe('https://example.com/about');
      expect(newPage.originalUrl).toBe('https://example.com/about?ref=home');
      expect(newPage.createdAt).toBeInstanceOf(Date);
    });

    it('should use normalizedUrl as originalUrl when not provided', () => {
      const newPage = PageModel.create({
        projectId: 'project-2',
        normalizedUrl: 'https://example.com/contact',
      });

      expect(newPage.normalizedUrl).toBe('https://example.com/contact');
      expect(newPage.originalUrl).toBe('https://example.com/contact');
    });
  });

  describe('validation', () => {
    it('should validate a valid page', () => {
      const model = new PageModel(mockPage);
      const validation = model.validate();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it('should fail validation when projectId is empty', () => {
      const invalid = { ...mockPage, projectId: '' };
      const model = new PageModel(invalid);
      const validation = model.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Project ID is required');
    });

    it('should fail validation when normalizedUrl is empty', () => {
      const invalid = { ...mockPage, normalizedUrl: '' };
      const model = new PageModel(invalid);
      const validation = model.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Normalized URL is required');
    });

    it('should fail validation when normalizedUrl is invalid', () => {
      const invalid = { ...mockPage, normalizedUrl: 'not-a-url' };
      const model = new PageModel(invalid);
      const validation = model.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Normalized URL must be a valid URL');
    });

    it('should fail validation when originalUrl is invalid', () => {
      const invalid = { ...mockPage, originalUrl: 'not-a-url' };
      const model = new PageModel(invalid);
      const validation = model.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Original URL must be a valid URL');
    });
  });

  describe('URL normalization helpers', () => {
    it('should normalize URL by removing query parameters', () => {
      const url = 'https://example.com/page?utm_source=test&ref=home';
      const normalized = PageModel.normalizeUrl(url);

      expect(normalized).toBe('https://example.com/page');
    });

    it('should normalize URL by removing trailing slash', () => {
      const url = 'https://example.com/page/';
      const normalized = PageModel.normalizeUrl(url);

      expect(normalized).toBe('https://example.com/page');
    });

    it('should normalize URL by removing hash', () => {
      const url = 'https://example.com/page#section';
      const normalized = PageModel.normalizeUrl(url);

      expect(normalized).toBe('https://example.com/page');
    });

    it('should normalize URL by combining all rules', () => {
      const url = 'https://example.com/page/?utm_source=test#top';
      const normalized = PageModel.normalizeUrl(url);

      expect(normalized).toBe('https://example.com/page');
    });

    it('should preserve path and protocol', () => {
      const url = 'https://example.com/path/to/page';
      const normalized = PageModel.normalizeUrl(url);

      expect(normalized).toBe('https://example.com/path/to/page');
    });

    it('should handle homepage correctly', () => {
      const url = 'https://example.com/';
      const normalized = PageModel.normalizeUrl(url);

      expect(normalized).toBe('https://example.com');
    });

    it('should handle URLs with port numbers', () => {
      const url = 'http://localhost:3000/page?test=1';
      const normalized = PageModel.normalizeUrl(url);

      expect(normalized).toBe('http://localhost:3000/page');
    });
  });

  describe('URL comparison', () => {
    it('should check if page matches a URL', () => {
      const model = new PageModel(mockPage);
      expect(model.matchesUrl('https://example.com/page')).toBe(true);
    });

    it('should match URL with different query parameters', () => {
      const model = new PageModel(mockPage);
      expect(model.matchesUrl('https://example.com/page?different=param')).toBe(
        true
      );
    });

    it('should not match different URLs', () => {
      const model = new PageModel(mockPage);
      expect(model.matchesUrl('https://example.com/other-page')).toBe(false);
    });

    it('should check if URLs are different', () => {
      const model = new PageModel(mockPage);
      expect(model.hasUrlChanged()).toBe(true);
    });

    it('should detect when URLs are the same', () => {
      const samePage = {
        ...mockPage,
        originalUrl: 'https://example.com/page',
      };
      const model = new PageModel(samePage);
      expect(model.hasUrlChanged()).toBe(false);
    });
  });

  describe('path helpers', () => {
    it('should extract pathname from normalized URL', () => {
      const model = new PageModel(mockPage);
      expect(model.getPath()).toBe('/page');
    });

    it('should extract hostname from normalized URL', () => {
      const model = new PageModel(mockPage);
      expect(model.getHostname()).toBe('example.com');
    });

    it('should get full normalized URL', () => {
      const model = new PageModel(mockPage);
      expect(model.getUrl()).toBe('https://example.com/page');
    });
  });

  describe('toJSON', () => {
    it('should serialize to Page interface', () => {
      const model = new PageModel(mockPage);
      const json = model.toJSON();

      expect(json).toEqual(mockPage);
      expect(json.id).toBe(mockPage.id);
      expect(json.normalizedUrl).toBe(mockPage.normalizedUrl);
    });

    it('should produce JSON with Date object', () => {
      const model = new PageModel(mockPage);
      const json = model.toJSON();

      expect(json.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('clone', () => {
    it('should create a deep copy of the page model', () => {
      const model = new PageModel(mockPage);
      const cloned = model.clone();

      expect(cloned).not.toBe(model);
      expect(cloned.id).toBe(model.id);
      expect(cloned.normalizedUrl).toBe(model.normalizedUrl);
      expect(cloned.createdAt).toEqual(model.createdAt);
    });
  });
});
