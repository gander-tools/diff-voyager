import { createHash } from 'node:crypto';

export function slug(url: string, path: string): string {
  const slugifiedPath = path.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const hash = createHash('sha256').update(url).digest('hex').slice(0, 8);

  return `${slugifiedPath}-${hash}`;
}
