/**
 * URL Normalizer unit tests
 */

import { describe, expect, it } from 'vitest';
import * as UrlNormalizer from '../../../src/domain/url-normalizer.js';

describe('UrlNormalizer', () => {
  describe('normalize', () => {
    it('should remove trailing slash', () => {
      expect(UrlNormalizer.normalize('https://example.com/page/')).toBe('/page');
    });

    it('should keep root path as is', () => {
      expect(UrlNormalizer.normalize('https://example.com/')).toBe('/');
    });

    it('should lowercase path', () => {
      expect(UrlNormalizer.normalize('https://example.com/Page')).toBe('/page');
    });

    it('should sort query parameters', () => {
      expect(UrlNormalizer.normalize('https://example.com/page?b=2&a=1')).toBe('/page?a=1&b=2');
    });

    it('should remove tracking parameters', () => {
      expect(UrlNormalizer.normalize('https://example.com/page?utm_source=test&id=1')).toBe(
        '/page?id=1',
      );
    });

    it('should remove fragment', () => {
      expect(UrlNormalizer.normalize('https://example.com/page#section')).toBe('/page');
    });

    it('should handle multiple tracking params', () => {
      expect(
        UrlNormalizer.normalize('https://example.com/page?utm_source=a&utm_medium=b&real=value'),
      ).toBe('/page?real=value');
    });

    it('should handle path without query', () => {
      expect(UrlNormalizer.normalize('https://example.com/some/deep/path')).toBe('/some/deep/path');
    });
  });

  describe('getOrigin', () => {
    it('should extract origin from URL', () => {
      expect(UrlNormalizer.getOrigin('https://example.com/page?q=1')).toBe('https://example.com');
    });

    it('should include port if non-standard', () => {
      expect(UrlNormalizer.getOrigin('http://localhost:3000/page')).toBe('http://localhost:3000');
    });
  });

  describe('isSameDomain', () => {
    it('should return true for same domain', () => {
      expect(UrlNormalizer.isSameDomain('https://example.com', 'https://example.com/page')).toBe(
        true,
      );
    });

    it('should return false for different domain', () => {
      expect(UrlNormalizer.isSameDomain('https://example.com', 'https://other.com/page')).toBe(
        false,
      );
    });

    it('should handle subdomains as different', () => {
      expect(
        UrlNormalizer.isSameDomain('https://example.com', 'https://sub.example.com/page'),
      ).toBe(false);
    });
  });
});
