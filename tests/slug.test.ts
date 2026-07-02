import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { pageSlug } from '../src/slug';

function md5(value: string): string {
  return createHash('md5').update(value).digest('hex');
}

// pageSlug(path, query_string) — V14 formula:
// [slugify(path), slugify(query_string), md5(path+'?'+query_string)].filter(Boolean).join('___')
// supersedes old slug(url, path); see SPEC.md §C:15, V14, T59.

describe('pageSlug', () => {
  it('is deterministic for the same path and query_string', () => {
    expect(pageSlug('/foo/bar', 'x=1')).toBe(pageSlug('/foo/bar', 'x=1'));
  });

  it('joins slugified path, slugified query_string, and md5 hash with "___"', () => {
    const path = '/foo/bar';
    const queryString = 'x=1';

    expect(pageSlug(path, queryString)).toBe(`foo-bar___x-1___${md5(`${path}?${queryString}`)}`);
  });

  it('drops the query_string segment when query_string is empty (filter(Boolean))', () => {
    const path = '/foo/bar';

    expect(pageSlug(path, '')).toBe(`foo-bar___${md5(`${path}?`)}`);
  });

  it('produces different slugs for different query_string values on the same path', () => {
    expect(pageSlug('/foo/bar', 'x=1')).not.toBe(pageSlug('/foo/bar', 'x=2'));
  });

  it('hash component is md5 of `${path}?${query_string}`, not of path or query_string alone', () => {
    const path = '/foo/bar';
    const queryString = 'x=1';

    const slug = pageSlug(path, queryString);

    expect(slug).not.toContain(md5(path));
    expect(slug).not.toContain(md5(queryString));
    expect(slug).toContain(md5(`${path}?${queryString}`));
  });

  it('slugifies non-alphanumeric characters in path and query_string consistently', () => {
    const path = '/foo/bar baz';
    const queryString = 'a=1&b=2';

    expect(pageSlug(path, queryString)).toBe(
      `foo-bar-baz___a-1-b-2___${md5(`${path}?${queryString}`)}`,
    );
  });
});
