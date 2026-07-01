import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addUrl, insertRunAndUrlRuns, loadUrls, runStart } from '../src/cli';
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

describe('run lifecycle', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = openDb(':memory:');
    migrate(db);
  });

  afterEach(() => {
    db.close();
  });

  function runStatus(runId: string): string {
    return (db.prepare('SELECT status FROM runs WHERE id = ?').get(runId) as { status: string })
      .status;
  }

  function urlRunCount(runId: string): number {
    return (
      db.prepare('SELECT COUNT(*) AS c FROM url_runs WHERE run_id = ?').get(runId) as {
        c: number;
      }
    ).c;
  }

  describe('runStart', () => {
    it("throws 'no URLs registered' when urls is empty", () => {
      expect(() => runStart(db)).toThrow('no URLs registered');
    });

    it('throws when a run is already open', () => {
      addUrl(db, 'https://example.com/a');
      runStart(db, () => ({ pid: 4242 }));

      expect(() => runStart(db, () => ({ pid: 4343 }))).toThrow('run 1 is still open');
    });

    it('creates run+url_runs, spawns the worker, saves pid, returns version+pid', () => {
      addUrl(db, 'https://example.com/a');
      addUrl(db, 'https://example.com/b');

      const result = runStart(db, () => ({ pid: 4242 }));

      expect(result).toEqual({ version: 1, pid: 4242 });
      const run = db.prepare('SELECT version, pid, status FROM runs').get() as {
        version: number;
        pid: number;
        status: string;
      };
      expect(run).toEqual({ version: 1, pid: 4242, status: 'open' });
      expect((db.prepare('SELECT COUNT(*) AS c FROM url_runs').get() as { c: number }).c).toBe(2);
    });

    it('deletes url_runs and the run, then rethrows, when spawnWorker throws', () => {
      addUrl(db, 'https://example.com/a');

      expect(() =>
        runStart(db, () => {
          throw new Error('spawn failed');
        }),
      ).toThrow('spawn failed');

      expect((db.prepare('SELECT COUNT(*) AS c FROM runs').get() as { c: number }).c).toBe(0);
      expect((db.prepare('SELECT COUNT(*) AS c FROM url_runs').get() as { c: number }).c).toBe(0);
    });
  });

  describe('insertRunAndUrlRuns', () => {
    it('inserts a run row and one url_runs row per registered url', () => {
      addUrl(db, 'https://example.com/a');
      addUrl(db, 'https://example.com/b');

      const runId = insertRunAndUrlRuns(db, 1);

      expect(runStatus(runId)).toBe('open');
      expect(urlRunCount(runId)).toBe(2);
    });

    it('rolls back the whole transaction on a version conflict (no orphan url_runs rows)', () => {
      addUrl(db, 'https://example.com/a');
      insertRunAndUrlRuns(db, 1);

      expect(() => insertRunAndUrlRuns(db, 1)).toThrow();
      expect((db.prepare('SELECT COUNT(*) AS c FROM runs').get() as { c: number }).c).toBe(1);
      expect((db.prepare('SELECT COUNT(*) AS c FROM url_runs').get() as { c: number }).c).toBe(1);
    });
  });
});
