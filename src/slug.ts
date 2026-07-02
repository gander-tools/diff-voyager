import { createHash } from 'node:crypto';

function slugify(value: string): string {
  return value.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function pageSlug(path: string, queryString: string): string {
  const hash = createHash('md5').update(`${path}?${queryString}`).digest('hex');

  return [slugify(path), slugify(queryString), hash].filter(Boolean).join('___');
}
