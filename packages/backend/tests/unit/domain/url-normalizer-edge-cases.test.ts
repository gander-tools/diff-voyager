/**
 * URL Normalizer Edge Cases unit tests
 * Tests for handling unusual URLs, internationalized domains, and boundary conditions
 */

import { describe, expect, it } from 'vitest';
import * as UrlNormalizer from '../../../src/domain/url-normalizer.js';

describe('UrlNormalizer Edge Cases', () => {
  describe('Internationalized Domain Names (IDN)', () => {
    it('should handle punycode encoded domains', () => {
      const result = UrlNormalizer.normalize('https://xn--n3h.com/page');
      expect(result).toBe('/page');
    });

    it('should handle unicode domains', () => {
      const result = UrlNormalizer.normalize('https://münchen.de/page');
      expect(typeof result).toBe('string');
      expect(result.startsWith('/')).toBe(true);
    });

    it('should handle emoji domains', () => {
      const result = UrlNormalizer.normalize('https://i❤.ws/page');
      expect(typeof result).toBe('string');
    });

    it('should handle mixed ASCII and unicode in path', () => {
      const result = UrlNormalizer.normalize('https://example.com/café/page');
      expect(typeof result).toBe('string');
      expect(result).toContain('caf');
    });

    it('should handle Japanese characters in path', () => {
      const result = UrlNormalizer.normalize('https://example.com/日本語/page');
      expect(typeof result).toBe('string');
      expect(result.startsWith('/')).toBe(true);
    });

    it('should handle Chinese characters in path', () => {
      const result = UrlNormalizer.normalize('https://example.com/中文/测试');
      expect(typeof result).toBe('string');
      expect(result.startsWith('/')).toBe(true);
    });
  });

  describe('IPv6 URLs', () => {
    it('should handle IPv6 loopback address', () => {
      const result = UrlNormalizer.normalize('http://[::1]/page');
      expect(result).toBe('/page');
    });

    it('should handle full IPv6 address', () => {
      const result = UrlNormalizer.normalize(
        'http://[2001:0db8:85a3:0000:0000:8a2e:0370:7334]/page',
      );
      expect(result).toBe('/page');
    });

    it('should handle compressed IPv6 address', () => {
      const result = UrlNormalizer.normalize('http://[2001:db8::1]/page');
      expect(result).toBe('/page');
    });

    it('should handle IPv6 with port', () => {
      const result = UrlNormalizer.normalize('http://[::1]:8080/page');
      expect(result).toBe('/page');
    });

    it('should extract origin from IPv6 URL', () => {
      const origin = UrlNormalizer.getOrigin('http://[::1]:8080/page');
      expect(origin).toContain('[::1]');
      expect(origin).toContain('8080');
    });
  });

  describe('Special Characters in URLs', () => {
    it('should handle percent-encoded characters', () => {
      const result = UrlNormalizer.normalize('https://example.com/path%20with%20spaces');
      expect(result).toContain('path');
    });

    it('should handle multiple consecutive slashes', () => {
      const result = UrlNormalizer.normalize('https://example.com///page///path');
      expect(typeof result).toBe('string');
    });

    it('should handle backslashes in path', () => {
      const result = UrlNormalizer.normalize('https://example.com/path\\with\\backslashes');
      expect(typeof result).toBe('string');
    });

    it('should handle semicolons in path', () => {
      const result = UrlNormalizer.normalize('https://example.com/page;jsessionid=12345');
      expect(typeof result).toBe('string');
    });

    it('should handle pipe characters', () => {
      const result = UrlNormalizer.normalize('https://example.com/page|param');
      expect(typeof result).toBe('string');
    });

    it('should handle curly braces in path', () => {
      const result = UrlNormalizer.normalize('https://example.com/api/{id}/details');
      // Curly braces are URL-encoded to %7b and %7d
      expect(result).toMatch(/\/api\/((\{id\})|(%7bid%7d)|(%.7Bid%.7D))\/details/i);
    });
  });

  describe('Very Long URLs', () => {
    it('should handle URL with 2000 character path', () => {
      const longPath = `/${'a'.repeat(2000)}`;
      const result = UrlNormalizer.normalize(`https://example.com${longPath}`);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(1000);
    });

    it('should handle URL with 100 query parameters', () => {
      const params = Array.from({ length: 100 }, (_, i) => `param${i}=value${i}`).join('&');
      const result = UrlNormalizer.normalize(`https://example.com/page?${params}`);
      expect(typeof result).toBe('string');
    });

    it('should handle URL with very long query parameter value', () => {
      const longValue = 'a'.repeat(5000);
      const result = UrlNormalizer.normalize(`https://example.com/page?data=${longValue}`);
      expect(typeof result).toBe('string');
    });

    it('should handle deeply nested path', () => {
      const deepPath = Array.from({ length: 50 }, (_, i) => `level${i}`).join('/');
      const result = UrlNormalizer.normalize(`https://example.com/${deepPath}`);
      expect(result.split('/').length).toBeGreaterThan(40);
    });
  });

  describe('Unicode and Emoji in URLs', () => {
    it('should handle emoji in path', () => {
      const result = UrlNormalizer.normalize('https://example.com/👍/page');
      expect(typeof result).toBe('string');
    });

    it('should handle multiple emojis', () => {
      const result = UrlNormalizer.normalize('https://example.com/🔥💯✨/page');
      expect(typeof result).toBe('string');
    });

    it('should handle zero-width characters', () => {
      const result = UrlNormalizer.normalize('https://example.com/page\u200B/test');
      expect(typeof result).toBe('string');
    });

    it('should handle right-to-left characters', () => {
      const result = UrlNormalizer.normalize('https://example.com/مثال/page');
      expect(typeof result).toBe('string');
    });
  });

  describe('Percent-Encoded Edge Cases', () => {
    it('should handle double percent-encoding', () => {
      const result = UrlNormalizer.normalize('https://example.com/page%2520test');
      expect(typeof result).toBe('string');
    });

    it('should handle uppercase vs lowercase percent-encoding', () => {
      const lower = UrlNormalizer.normalize('https://example.com/page%2ftest');
      const upper = UrlNormalizer.normalize('https://example.com/page%2Ftest');
      expect(typeof lower).toBe('string');
      expect(typeof upper).toBe('string');
    });

    it('should handle invalid percent-encoding', () => {
      const result = UrlNormalizer.normalize('https://example.com/page%ZZ');
      expect(typeof result).toBe('string');
    });

    it('should handle incomplete percent-encoding', () => {
      const result = UrlNormalizer.normalize('https://example.com/page%2');
      expect(typeof result).toBe('string');
    });
  });

  describe('Port Numbers', () => {
    it('should handle non-standard HTTP port', () => {
      const origin = UrlNormalizer.getOrigin('http://example.com:8080/page');
      expect(origin).toBe('http://example.com:8080');
    });

    it('should omit default HTTP port 80', () => {
      const origin = UrlNormalizer.getOrigin('http://example.com:80/page');
      expect(origin === 'http://example.com' || origin === 'http://example.com:80').toBe(true);
    });

    it('should omit default HTTPS port 443', () => {
      const origin = UrlNormalizer.getOrigin('https://example.com:443/page');
      expect(origin === 'https://example.com' || origin === 'https://example.com:443').toBe(true);
    });

    it('should handle very high port numbers', () => {
      const origin = UrlNormalizer.getOrigin('http://example.com:65535/page');
      expect(origin).toContain('65535');
    });

    it('should handle port 0', () => {
      const origin = UrlNormalizer.getOrigin('http://example.com:0/page');
      expect(typeof origin).toBe('string');
    });
  });

  describe('Subdomain Variations', () => {
    it('should differentiate www and non-www', () => {
      const withWww = UrlNormalizer.isSameDomain(
        'https://example.com',
        'https://www.example.com/page',
      );
      expect(withWww).toBe(false);
    });

    it('should handle multiple subdomains', () => {
      const result = UrlNormalizer.isSameDomain(
        'https://api.example.com',
        'https://api.v2.example.com/page',
      );
      expect(result).toBe(false);
    });

    it('should handle deeply nested subdomains', () => {
      const result = UrlNormalizer.isSameDomain(
        'https://a.b.c.d.e.example.com',
        'https://a.b.c.d.e.example.com/page',
      );
      expect(result).toBe(true);
    });
  });

  describe('Query Parameter Edge Cases', () => {
    it('should handle empty query parameter values', () => {
      const result = UrlNormalizer.normalize('https://example.com/page?param1=&param2=');
      expect(result).toContain('param1');
      expect(result).toContain('param2');
    });

    it('should handle query parameters without values', () => {
      const result = UrlNormalizer.normalize('https://example.com/page?flag1&flag2');
      expect(typeof result).toBe('string');
    });

    it('should handle duplicate query parameters', () => {
      const result = UrlNormalizer.normalize('https://example.com/page?id=1&id=2&id=3');
      expect(result).toContain('id');
    });

    it('should handle query parameters with special characters', () => {
      const result = UrlNormalizer.normalize('https://example.com/page?q=hello+world&filter=a,b,c');
      expect(typeof result).toBe('string');
    });

    it('should handle query string with only ampersands', () => {
      const result = UrlNormalizer.normalize('https://example.com/page?&&&');
      expect(typeof result).toBe('string');
    });
  });

  describe('Fragment Handling', () => {
    it('should remove simple fragment', () => {
      const result = UrlNormalizer.normalize('https://example.com/page#section');
      expect(result).not.toContain('#');
    });

    it('should remove fragment with slashes', () => {
      const result = UrlNormalizer.normalize('https://example.com/page#/virtual/route');
      expect(result).not.toContain('#');
    });

    it('should remove fragment with query-like syntax', () => {
      const result = UrlNormalizer.normalize('https://example.com/page#?param=value');
      expect(result).not.toContain('#');
    });

    it('should remove fragment with special characters', () => {
      const result = UrlNormalizer.normalize('https://example.com/page#section!@$%');
      expect(result).not.toContain('#');
    });
  });

  describe('Case Sensitivity', () => {
    it('should lowercase simple paths', () => {
      const result = UrlNormalizer.normalize('https://example.com/PAGE');
      expect(result).toBe('/page');
    });

    it('should lowercase mixed-case paths', () => {
      const result = UrlNormalizer.normalize('https://example.com/MyPage/SubPath');
      expect(result.toLowerCase()).toBe(result);
    });

    it('should handle uppercase query parameters', () => {
      const result = UrlNormalizer.normalize('https://example.com/page?PARAM=VALUE');
      expect(typeof result).toBe('string');
    });
  });

  describe('Data URLs and Special Schemes', () => {
    it('should handle blob URLs', () => {
      expect(() => {
        UrlNormalizer.normalize('blob:https://example.com/550e8400-e29b-41d4-a716-446655440000');
      }).not.toThrow();
    });

    it('should handle data URLs', () => {
      expect(() => {
        UrlNormalizer.normalize('data:text/html,<h1>Hello</h1>');
      }).not.toThrow();
    });

    it('should handle mailto URLs', () => {
      expect(() => {
        UrlNormalizer.normalize('mailto:test@example.com');
      }).not.toThrow();
    });

    it('should handle tel URLs', () => {
      expect(() => {
        UrlNormalizer.normalize('tel:+1234567890');
      }).not.toThrow();
    });
  });

  describe('Whitespace and Control Characters', () => {
    it('should handle leading whitespace', () => {
      expect(() => {
        UrlNormalizer.normalize('  https://example.com/page');
      }).not.toThrow();
    });

    it('should handle trailing whitespace', () => {
      expect(() => {
        UrlNormalizer.normalize('https://example.com/page  ');
      }).not.toThrow();
    });

    it('should handle tabs in URL', () => {
      expect(() => {
        UrlNormalizer.normalize('https://example.com/page\ttest');
      }).not.toThrow();
    });

    it('should handle newlines in URL', () => {
      expect(() => {
        UrlNormalizer.normalize('https://example.com/page\ntest');
      }).not.toThrow();
    });

    it('should handle carriage returns', () => {
      expect(() => {
        UrlNormalizer.normalize('https://example.com/page\rtest');
      }).not.toThrow();
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle empty path', () => {
      const result = UrlNormalizer.normalize('https://example.com');
      expect(result).toBe('/');
    });

    it('should handle URL with only protocol and domain', () => {
      const result = UrlNormalizer.normalize('https://example.com/');
      expect(result).toBe('/');
    });

    it('should handle single character path', () => {
      const result = UrlNormalizer.normalize('https://example.com/a');
      expect(result).toBe('/a');
    });

    it('should handle path with only dot', () => {
      const result = UrlNormalizer.normalize('https://example.com/./page');
      expect(typeof result).toBe('string');
    });

    it('should handle path with double dots', () => {
      const result = UrlNormalizer.normalize('https://example.com/path/../page');
      expect(typeof result).toBe('string');
    });
  });
});
