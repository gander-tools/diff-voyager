import { randomUUID } from 'node:crypto';
import { count, eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { urls } from '../schema';
import { pageSlug } from '../slug';
import type { UrlRecord } from '../types';

export interface UrlsRepo {
  insert(url: string): 'added' | 'exists';
  exists(url: string): boolean;
  findById(id: string): UrlRecord | undefined;
  list(): UrlRecord[];
  remove(url: string): 'removed' | 'not-found';
  clear(): number;
  count(): number;
}

function toUrlRecord(row: typeof urls.$inferSelect): UrlRecord {
  return {
    id: row.id,
    url: row.url,
    host: row.host,
    path: row.path,
    query_string: row.queryString,
    page_slug: row.pageSlug,
    created_at: row.createdAt as number,
  };
}

export class DrizzleUrlsRepo implements UrlsRepo {
  constructor(private readonly db: BetterSQLite3Database) {}

  insert(url: string): 'added' | 'exists' {
    if (this.exists(url)) {
      return 'exists';
    }

    const parsed = new URL(url);
    const path = parsed.pathname;
    const host = parsed.host;
    const queryString = parsed.search.replace(/^\?/, '');
    const slug = pageSlug(path, queryString);

    this.db
      .insert(urls)
      .values({ id: randomUUID(), url, host, path, queryString, pageSlug: slug })
      .run();
    return 'added';
  }

  exists(url: string): boolean {
    return this.db.select({ id: urls.id }).from(urls).where(eq(urls.url, url)).get() !== undefined;
  }

  findById(id: string): UrlRecord | undefined {
    const row = this.db.select().from(urls).where(eq(urls.id, id)).get();
    return row ? toUrlRecord(row) : undefined;
  }

  list(): UrlRecord[] {
    return this.db.select().from(urls).all().map(toUrlRecord);
  }

  remove(url: string): 'removed' | 'not-found' {
    const result = this.db.delete(urls).where(eq(urls.url, url)).run();
    return result.changes > 0 ? 'removed' : 'not-found';
  }

  clear(): number {
    return this.db.delete(urls).run().changes;
  }

  count(): number {
    return this.db.select({ c: count() }).from(urls).get()?.c ?? 0;
  }
}
