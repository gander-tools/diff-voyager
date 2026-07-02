import { describe, expect, it } from 'vitest';
import { effectiveUrl, parseBaseUrl } from '../src/baseUrl';

describe('parseBaseUrl', () => {
  it('passes through a valid http origin', () => {
    expect(parseBaseUrl('http://example.com')).toBe('http://example.com');
  });

  it('passes through a valid https origin, preserving a non-default port', () => {
    expect(parseBaseUrl('https://example.com:3000')).toBe('https://example.com:3000');
  });

  it('silently strips path, query, and hash to the origin', () => {
    expect(parseBaseUrl('https://example.com:3000/foo?x=1#y')).toBe('https://example.com:3000');
  });

  it('throws for a malformed url', () => {
    expect(() => parseBaseUrl('not-a-url')).toThrow();
  });

  it('throws when no protocol is given', () => {
    expect(() => parseBaseUrl('example.com')).toThrow();
  });

  it('throws for a scheme outside http/https', () => {
    expect(() => parseBaseUrl('ftp://example.com')).toThrow();
  });
});

describe('effectiveUrl', () => {
  it('joins the base-url origin with the path, query, and hash of the original url', () => {
    expect(effectiveUrl('https://cdn.example.com', 'https://example.com/a/b?x=1#y')).toBe(
      'https://cdn.example.com/a/b?x=1#y',
    );
  });

  it('appends just the root path when the original url has no path/query/hash', () => {
    expect(effectiveUrl('https://cdn.example.com', 'https://example.com')).toBe(
      'https://cdn.example.com/',
    );
  });
});
