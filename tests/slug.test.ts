import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { slug } from '../src/slug';

function sha256First8(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 8);
}

describe('slug', () => {
  it('produces a deterministic slug for the same url and path', () => {
    const url = 'https://example.com/foo/bar';
    const path = '/foo/bar';

    expect(slug(url, path)).toBe(slug(url, path));
  });

  it('produces different slugs for different urls with the same path', () => {
    const path = '/foo/bar';

    expect(slug('https://example.com/foo/bar', path)).not.toBe(
      slug('https://example.org/foo/bar', path),
    );
  });

  it("replaces non-alphanumeric characters in the path with '-'", () => {
    const url = 'https://example.com/foo/bar?x=1';
    const path = '/foo/bar?x=1';

    expect(slug(url, path)).toBe(`foo-bar-x-1-${sha256First8(url)}`);
  });

  it("trims leading and trailing '-' from the slugified path", () => {
    const url = 'https://example.com/foo-bar/';
    const path = '/foo-bar/';

    expect(slug(url, path)).toBe(`foo-bar-${sha256First8(url)}`);
  });

  it('appends the first 8 hex characters of sha256(url) to the slug', () => {
    const url = 'https://example.com/foo';
    const path = '/foo';

    expect(slug(url, path)).toBe(`foo-${sha256First8(url)}`);
  });
});
