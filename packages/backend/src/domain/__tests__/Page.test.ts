import { describe, it, expect } from 'vitest';
import { PageModel } from '../models/Page.js';

describe('PageModel', () => {
  describe('create', () => {
    it('should create a new page with normalized URL', () => {
      const page = PageModel.create({
        projectId: 'project-123',
        url: 'https://example.com/page',
      });

      expect(page.id).toBeTruthy();
      expect(page.projectId).toBe('project-123');
      expect(page.normalizedUrl).toBe('https://example.com/page');
      expect(page.originalUrl).toBe('https://example.com/page');
      expect(page.createdAt).toBeInstanceOf(Date);
    });

    it('should normalize URL by removing trailing slash', () => {
      const page = PageModel.create({
        projectId: 'project-123',
        url: 'https://example.com/page/',
      });

      expect(page.normalizedUrl).toBe('https://example.com/page');
      expect(page.originalUrl).toBe('https://example.com/page/');
    });

    it('should normalize URL by sorting query parameters', () => {
      const page = PageModel.create({
        projectId: 'project-123',
        url: 'https://example.com/page?b=2&a=1',
      });

      expect(page.normalizedUrl).toBe('https://example.com/page?a=1&b=2');
      expect(page.originalUrl).toBe('https://example.com/page?b=2&a=1');
    });

    it('should normalize URL by removing fragment', () => {
      const page = PageModel.create({
        projectId: 'project-123',
        url: 'https://example.com/page#section',
      });

      expect(page.normalizedUrl).toBe('https://example.com/page');
      expect(page.originalUrl).toBe('https://example.com/page#section');
    });

    it('should normalize URL by removing specified query parameters', () => {
      const page = PageModel.create({
        projectId: 'project-123',
        url: 'https://example.com/page?id=1&utm_source=google&session=abc',
        ignoreParams: ['utm_source', 'session'],
      });

      expect(page.normalizedUrl).toBe('https://example.com/page?id=1');
      expect(page.originalUrl).toBe(
        'https://example.com/page?id=1&utm_source=google&session=abc'
      );
    });

    it('should handle URL with all normalizations combined', () => {
      const page = PageModel.create({
        projectId: 'project-123',
        url: 'https://example.com/page/?c=3&b=2&a=1&utm_source=google#section',
        ignoreParams: ['utm_source'],
      });

      expect(page.normalizedUrl).toBe('https://example.com/page?a=1&b=2&c=3');
      expect(page.originalUrl).toBe(
        'https://example.com/page/?c=3&b=2&a=1&utm_source=google#section'
      );
    });

    it('should throw error if URL is invalid', () => {
      expect(() => {
        PageModel.create({
          projectId: 'project-123',
          url: 'not-a-url',
        });
      }).toThrow('Invalid URL');
    });
  });

  describe('isSamePage', () => {
    it('should return true for pages with same normalized URL', () => {
      const page1 = PageModel.create({
        projectId: 'project-123',
        url: 'https://example.com/page/',
      });

      const page2 = PageModel.create({
        projectId: 'project-123',
        url: 'https://example.com/page',
      });

      expect(PageModel.isSamePage(page1, page2)).toBe(true);
    });

    it('should return false for pages with different normalized URLs', () => {
      const page1 = PageModel.create({
        projectId: 'project-123',
        url: 'https://example.com/page1',
      });

      const page2 = PageModel.create({
        projectId: 'project-123',
        url: 'https://example.com/page2',
      });

      expect(PageModel.isSamePage(page1, page2)).toBe(false);
    });

    it('should return true for pages with same normalized URL despite different query order', () => {
      const page1 = PageModel.create({
        projectId: 'project-123',
        url: 'https://example.com/page?a=1&b=2',
      });

      const page2 = PageModel.create({
        projectId: 'project-123',
        url: 'https://example.com/page?b=2&a=1',
      });

      expect(PageModel.isSamePage(page1, page2)).toBe(true);
    });
  });

  describe('toJSON and fromJSON', () => {
    it('should serialize and deserialize page correctly', () => {
      const page = PageModel.create({
        projectId: 'project-123',
        url: 'https://example.com/page?b=2&a=1',
      });

      const json = PageModel.toJSON(page);
      const deserializedPage = PageModel.fromJSON(json);

      expect(deserializedPage.id).toBe(page.id);
      expect(deserializedPage.projectId).toBe(page.projectId);
      expect(deserializedPage.normalizedUrl).toBe(page.normalizedUrl);
      expect(deserializedPage.originalUrl).toBe(page.originalUrl);
      expect(deserializedPage.createdAt).toEqual(page.createdAt);
    });
  });
});
