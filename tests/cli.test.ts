import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  abandonRun,
  addUrl,
  insertRunAndUrlRuns,
  loadUrls,
  runReset,
  runStart,
  runStop,
  urlClear,
  urlList,
  urlRemove,
} from '../src/cli';
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

    it('rolls back all inserts from this call when a write fails mid-loop (real transaction, V13)', () => {
      addUrl(db, 'https://example.com/existing');
      const filePath = writeUrlsFile(
        ['https://example.com/b', 'https://example.com/c'].join('\n'),
      );

      const originalPrepare = db.prepare.bind(db);
      let insertCalls = 0;
      vi.spyOn(db, 'prepare').mockImplementation(((sql: string) => {
        if (sql.startsWith('INSERT INTO urls')) {
          insertCalls++;
          if (insertCalls === 2) {
            return { run: () => {
              throw new Error('disk full');
            } } as unknown as ReturnType<Database.Database['prepare']>;
          }
        }
        return originalPrepare(sql);
      }) as Database.Database['prepare']);

      expect(() => loadUrls(db, filePath)).toThrow('disk full');
      expect(urlCount()).toBe(1);

      vi.restoreAllMocks();
    });
  });
});

describe('run lifecycle / url management', () => {
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
    it('throws \'no URLs registered\' when urls is empty', () => {
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
      expect(
        (db.prepare('SELECT COUNT(*) AS c FROM url_runs').get() as { c: number }).c,
      ).toBe(2);
    });

    it('deletes url_runs and the run, then rethrows, when spawnWorker throws', () => {
      addUrl(db, 'https://example.com/a');

      expect(() =>
        runStart(db, () => {
          throw new Error('spawn failed');
        }),
      ).toThrow('spawn failed');

      expect((db.prepare('SELECT COUNT(*) AS c FROM runs').get() as { c: number }).c).toBe(0);
      expect(
        (db.prepare('SELECT COUNT(*) AS c FROM url_runs').get() as { c: number }).c,
      ).toBe(0);
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
      expect(
        (db.prepare('SELECT COUNT(*) AS c FROM runs').get() as { c: number }).c,
      ).toBe(1);
      expect(
        (db.prepare('SELECT COUNT(*) AS c FROM url_runs').get() as { c: number }).c,
      ).toBe(1);
    });
  });

  describe('urlRemove', () => {
    it('throws when a run is open', () => {
      addUrl(db, 'https://example.com/a');
      runStart(db, () => ({ pid: 4242 }));

      expect(() => urlRemove(db, 'https://example.com/a')).toThrow('run 1 is still open');
    });

    it("removes an existing url and returns 'removed'", () => {
      addUrl(db, 'https://example.com/a');

      expect(urlRemove(db, 'https://example.com/a')).toBe('removed');
      expect(
        (db.prepare('SELECT COUNT(*) AS c FROM urls').get() as { c: number }).c,
      ).toBe(0);
    });

    it("returns 'not-found' for a url that does not exist", () => {
      expect(urlRemove(db, 'https://example.com/missing')).toBe('not-found');
    });
  });

  describe('urlClear', () => {
    it('throws when a run is open', () => {
      addUrl(db, 'https://example.com/a');
      runStart(db, () => ({ pid: 4242 }));

      expect(() => urlClear(db)).toThrow('run 1 is still open');
    });

    it('deletes all urls and returns the count', () => {
      addUrl(db, 'https://example.com/a');
      addUrl(db, 'https://example.com/b');

      expect(urlClear(db)).toBe(2);
      expect(
        (db.prepare('SELECT COUNT(*) AS c FROM urls').get() as { c: number }).c,
      ).toBe(0);
    });
  });

  describe('urlList', () => {
    it('returns registered urls with their created_at timestamp', () => {
      addUrl(db, 'https://example.com/a');

      expect(urlList(db)).toEqual([
        { url: 'https://example.com/a', createdAt: expect.any(Number) },
      ]);
    });
  });

  describe('runStop', () => {
    it('kills the process, deletes url_runs, marks the run abandoned', () => {
      addUrl(db, 'https://example.com/a');
      const { pid } = runStart(db, () => ({ pid: 4242 }));
      const run = db.prepare('SELECT id FROM runs').get() as { id: string };
      const killed: number[] = [];

      runStop(db, (killPid) => {
        killed.push(killPid);
      });

      expect(killed).toEqual([pid]);
      expect(runStatus(run.id)).toBe('abandoned');
      expect(urlRunCount(run.id)).toBe(0);
    });

    it("throws 'process not found, use run reset' when kill fails with ESRCH", () => {
      addUrl(db, 'https://example.com/a');
      runStart(db, () => ({ pid: 4242 }));

      expect(() =>
        runStop(db, () => {
          throw Object.assign(new Error('kill ESRCH'), { code: 'ESRCH' });
        }),
      ).toThrow('process not found, use run reset');
    });

    it("throws 'no open run' when there is no open run", () => {
      expect(() => runStop(db, () => {})).toThrow('no open run');
    });
  });

  describe('runReset', () => {
    it('deletes url_runs and marks the run abandoned, without killing anything', () => {
      addUrl(db, 'https://example.com/a');
      runStart(db, () => ({ pid: 4242 }));
      const openRun = db.prepare('SELECT id FROM runs').get() as { id: string };

      runReset(db);

      expect(runStatus(openRun.id)).toBe('abandoned');
      expect(urlRunCount(openRun.id)).toBe(0);
    });

    it("throws 'no open run' when there is no open run", () => {
      expect(() => runReset(db)).toThrow('no open run');
    });
  });

  describe('abandonRun', () => {
    it('does not overwrite a run already marked done (abandoned-race guard)', () => {
      const runId = randomUUID();
      db.prepare("INSERT INTO runs (id, version, status) VALUES (?, ?, 'done')").run(runId, 1);

      abandonRun(db, runId);

      expect(runStatus(runId)).toBe('done');
    });
  });
});
