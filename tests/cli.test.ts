import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addUrl, loadUrls } from '../src/cli';
import { migrate, openDb } from '../src/db';

describe('addUrl / loadUrls', () => {
  let db: Database.Database;
  let tmpDir: string;

  beforeEach(() => {
    db = openDb(':memory:');
    migrate(db);
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-cli-'));
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function urlCount(): number {
    return (db.prepare('SELECT COUNT(*) AS c FROM urls').get() as { c: number }).c;
  }

  describe('addUrl', () => {
    it('inserts a row for a valid url', () => {
      expect(addUrl(db, 'https://example.com/a')).toBe('added');
      expect(urlCount()).toBe(1);
    });

    it('throws and does not insert for an invalid url', () => {
      expect(() => addUrl(db, 'not-a-url')).toThrow();
      expect(urlCount()).toBe(0);
    });

    it("returns 'exists' and does not insert a duplicate url", () => {
      addUrl(db, 'https://example.com/a');

      expect(addUrl(db, 'https://example.com/a')).toBe('exists');
      expect(urlCount()).toBe(1);
    });
  });

  describe('loadUrls', () => {
    function writeUrlsFile(contents: string): string {
      const filePath = path.join(tmpDir, 'urls.txt');
      fs.writeFileSync(filePath, contents);
      return filePath;
    }

    it("inserts urls from file, skipping empty lines and '#' comments", () => {
      const filePath = writeUrlsFile(
        ['https://example.com/a', '# a comment', '', 'https://example.com/b'].join('\n'),
      );

      const result = loadUrls(db, filePath);

      expect(result).toEqual({ added: 2, skipped: 0 });
      expect(urlCount()).toBe(2);
    });

    it('skips urls already present in the urls table, counts them as skipped', () => {
      addUrl(db, 'https://example.com/a');
      const filePath = writeUrlsFile(
        ['https://example.com/a', 'https://example.com/b'].join('\n'),
      );

      const result = loadUrls(db, filePath);

      expect(result).toEqual({ added: 1, skipped: 1 });
      expect(urlCount()).toBe(2);
    });

    it('rolls back entirely and throws listing invalid lines when any line is an invalid url', () => {
      const filePath = writeUrlsFile(
        ['https://example.com/a', 'not-a-url', 'https://example.com/b'].join('\n'),
      );

      expect(() => loadUrls(db, filePath)).toThrow(/not-a-url/);
      expect(urlCount()).toBe(0);
    });
  });
});
