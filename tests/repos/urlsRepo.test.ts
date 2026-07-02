import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { migrate, openDb, toDrizzle } from '../../src/db';
import { DrizzleUrlsRepo, type UrlsRepo } from '../../src/repos/urlsRepo';

describe('UrlsRepo', () => {
  let tmpDir: string;
  let db: Database.Database;
  let repo: UrlsRepo;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-urlsrepo-'));
    db = openDb(path.join(tmpDir, 'test.db'));
    migrate(db);
    repo = new DrizzleUrlsRepo(toDrizzle(db));
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('insert', () => {
    it('returns added and persists a new url with derived path', () => {
      expect(repo.insert('https://example.com/a/b')).toBe('added');
      const row = db.prepare('SELECT url, path FROM urls WHERE url = ?').get(
        'https://example.com/a/b',
      ) as { url: string; path: string };
      expect(row).toEqual({ url: 'https://example.com/a/b', path: '/a/b' });
    });

    it('returns exists and skips insert for a duplicate url', () => {
      repo.insert('https://example.com/a');
      expect(repo.insert('https://example.com/a')).toBe('exists');
      const count = (db.prepare('SELECT COUNT(*) AS c FROM urls').get() as { c: number }).c;
      expect(count).toBe(1);
    });
  });

  describe('exists', () => {
    it('returns false when the url is not registered', () => {
      expect(repo.exists('https://example.com/a')).toBe(false);
    });

    it('returns true when the url is registered', () => {
      repo.insert('https://example.com/a');
      expect(repo.exists('https://example.com/a')).toBe(true);
    });
  });

  describe('findById', () => {
    it('returns undefined for an unknown id', () => {
      expect(repo.findById('missing')).toBeUndefined();
    });

    it('returns the UrlRecord for a known id', () => {
      repo.insert('https://example.com/a');
      const { id } = db.prepare('SELECT id FROM urls WHERE url = ?').get(
        'https://example.com/a',
      ) as { id: string };
      expect(repo.findById(id)).toEqual({
        id,
        url: 'https://example.com/a',
        path: '/a',
        created_at: expect.any(Number),
      });
    });
  });

  describe('list', () => {
    it('returns an empty array when no urls are registered', () => {
      expect(repo.list()).toEqual([]);
    });

    it('returns all registered urls as UrlRecord[]', () => {
      repo.insert('https://example.com/a');
      repo.insert('https://example.com/b');
      const rows = repo.list();
      expect(rows).toHaveLength(2);
      expect(rows.map((row) => row.url).sort()).toEqual([
        'https://example.com/a',
        'https://example.com/b',
      ]);
    });
  });

  describe('remove', () => {
    it('returns not-found when the url is not registered', () => {
      expect(repo.remove('https://example.com/a')).toBe('not-found');
    });

    it('returns removed and deletes a registered url', () => {
      repo.insert('https://example.com/a');
      expect(repo.remove('https://example.com/a')).toBe('removed');
      expect(repo.exists('https://example.com/a')).toBe(false);
    });
  });

  describe('clear', () => {
    it('returns 0 when there are no urls', () => {
      expect(repo.clear()).toBe(0);
    });

    it('deletes all urls and returns the count removed', () => {
      repo.insert('https://example.com/a');
      repo.insert('https://example.com/b');
      expect(repo.clear()).toBe(2);
      expect(repo.list()).toEqual([]);
    });
  });

  describe('count', () => {
    it('returns 0 when there are no urls', () => {
      expect(repo.count()).toBe(0);
    });

    it('returns the number of registered urls', () => {
      repo.insert('https://example.com/a');
      repo.insert('https://example.com/b');
      expect(repo.count()).toBe(2);
    });
  });
});
