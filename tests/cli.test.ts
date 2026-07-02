import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  abandonRun,
  addUrl,
  loadUrls,
  runReset,
  runStart,
  runStop,
  urlClear,
  urlList,
  urlRemove,
} from '../src/cli';
import { migrate, openDb, toDrizzle } from '../src/db';
import { DrizzleRunsRepo, type RunsRepo } from '../src/repos/runsRepo';
import { DrizzleUrlRunsRepo, type UrlRunsRepo } from '../src/repos/urlRunsRepo';
import { DrizzleUrlsRepo, type UrlsRepo } from '../src/repos/urlsRepo';

describe('addUrl / loadUrls', () => {
  let db: Database.Database;
  let urlsRepo: UrlsRepo;
  let tmpDir: string;

  beforeEach(() => {
    db = openDb(':memory:');
    migrate(db);
    urlsRepo = new DrizzleUrlsRepo(toDrizzle(db));
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
      expect(addUrl(urlsRepo, 'https://example.com/a')).toBe('added');
      expect(urlCount()).toBe(1);
    });

    it('throws and does not insert for an invalid url', () => {
      expect(() => addUrl(urlsRepo, 'not-a-url')).toThrow();
      expect(urlCount()).toBe(0);
    });

    it("returns 'exists' and does not insert a duplicate url", () => {
      addUrl(urlsRepo, 'https://example.com/a');

      expect(addUrl(urlsRepo, 'https://example.com/a')).toBe('exists');
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

      const result = loadUrls(urlsRepo, filePath, toDrizzle(db));

      expect(result).toEqual({ added: 2, skipped: 0 });
      expect(urlCount()).toBe(2);
    });

    it('skips urls already present in the urls table, counts them as skipped', () => {
      addUrl(urlsRepo, 'https://example.com/a');
      const filePath = writeUrlsFile(
        ['https://example.com/a', 'https://example.com/b'].join('\n'),
      );

      const result = loadUrls(urlsRepo, filePath, toDrizzle(db));

      expect(result).toEqual({ added: 1, skipped: 1 });
      expect(urlCount()).toBe(2);
    });

    it('rolls back entirely and throws listing invalid lines when any line is an invalid url', () => {
      const filePath = writeUrlsFile(
        ['https://example.com/a', 'not-a-url', 'https://example.com/b'].join('\n'),
      );

      expect(() => loadUrls(urlsRepo, filePath, toDrizzle(db))).toThrow(/not-a-url/);
      expect(urlCount()).toBe(0);
    });

    it('rolls back all inserts from this call when a write fails mid-loop (real transaction, V13)', () => {
      addUrl(urlsRepo, 'https://example.com/existing');
      const filePath = writeUrlsFile(
        ['https://example.com/b', 'https://example.com/c'].join('\n'),
      );

      let insertCalls = 0;
      const originalInsert = urlsRepo.insert.bind(urlsRepo);
      vi.spyOn(urlsRepo, 'insert').mockImplementation((url: string) => {
        insertCalls++;
        if (insertCalls === 2) {
          throw new Error('disk full');
        }
        return originalInsert(url);
      });

      expect(() => loadUrls(urlsRepo, filePath, toDrizzle(db))).toThrow('disk full');
      expect(urlCount()).toBe(1);

      vi.restoreAllMocks();
    });
  });
});

describe('run lifecycle / url management', () => {
  let db: Database.Database;
  let runsRepo: RunsRepo;
  let urlsRepo: UrlsRepo;
  let urlRunsRepo: UrlRunsRepo;

  beforeEach(() => {
    db = openDb(':memory:');
    migrate(db);
    const drizzleDb = toDrizzle(db);
    runsRepo = new DrizzleRunsRepo(drizzleDb);
    urlsRepo = new DrizzleUrlsRepo(drizzleDb);
    urlRunsRepo = new DrizzleUrlRunsRepo(drizzleDb);
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
      expect(() => runStart(runsRepo, urlsRepo, urlRunsRepo)).toThrow('no URLs registered');
    });

    it('throws when a run is already open', () => {
      addUrl(urlsRepo, 'https://example.com/a');
      runStart(runsRepo, urlsRepo, urlRunsRepo, () => ({ pid: 4242 }));

      expect(() =>
        runStart(runsRepo, urlsRepo, urlRunsRepo, () => ({ pid: 4343 })),
      ).toThrow('run 1 is still open');
    });

    it('creates run+url_runs, spawns the worker, saves pid, returns version+pid', () => {
      addUrl(urlsRepo, 'https://example.com/a');
      addUrl(urlsRepo, 'https://example.com/b');

      const result = runStart(runsRepo, urlsRepo, urlRunsRepo, () => ({ pid: 4242 }));

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
      addUrl(urlsRepo, 'https://example.com/a');

      expect(() =>
        runStart(runsRepo, urlsRepo, urlRunsRepo, () => {
          throw new Error('spawn failed');
        }),
      ).toThrow('spawn failed');

      expect((db.prepare('SELECT COUNT(*) AS c FROM runs').get() as { c: number }).c).toBe(0);
      expect((db.prepare('SELECT COUNT(*) AS c FROM url_runs').get() as { c: number }).c).toBe(0);
    });

    it('forwards the parsed base-url origin to spawnWorker when given (V34)', () => {
      addUrl(urlsRepo, 'https://example.com/a');
      const spawnWorker = vi.fn().mockReturnValue({ pid: 4242 });

      runStart(runsRepo, urlsRepo, urlRunsRepo, spawnWorker, 'https://cdn.example.com/ignored');

      expect(spawnWorker).toHaveBeenCalledWith('https://cdn.example.com');
    });

    it('omits the base-url arg to spawnWorker when not given', () => {
      addUrl(urlsRepo, 'https://example.com/a');
      const spawnWorker = vi.fn().mockReturnValue({ pid: 4242 });

      runStart(runsRepo, urlsRepo, urlRunsRepo, spawnWorker);

      expect(spawnWorker).toHaveBeenCalledWith(undefined);
    });

    it('throws for a malformed base-url before creating run/url_runs or spawning (V35,V36)', () => {
      addUrl(urlsRepo, 'https://example.com/a');
      const spawnWorker = vi.fn().mockReturnValue({ pid: 4242 });

      expect(() => runStart(runsRepo, urlsRepo, urlRunsRepo, spawnWorker, 'not-a-url')).toThrow();

      expect(spawnWorker).not.toHaveBeenCalled();
      expect((db.prepare('SELECT COUNT(*) AS c FROM runs').get() as { c: number }).c).toBe(0);
      expect((db.prepare('SELECT COUNT(*) AS c FROM url_runs').get() as { c: number }).c).toBe(0);
    });

    it('throws for a base-url with an unsupported scheme before creating run/url_runs or spawning (V35,V36)', () => {
      addUrl(urlsRepo, 'https://example.com/a');
      const spawnWorker = vi.fn().mockReturnValue({ pid: 4242 });

      expect(() =>
        runStart(runsRepo, urlsRepo, urlRunsRepo, spawnWorker, 'ftp://example.com'),
      ).toThrow();

      expect(spawnWorker).not.toHaveBeenCalled();
      expect((db.prepare('SELECT COUNT(*) AS c FROM runs').get() as { c: number }).c).toBe(0);
      expect((db.prepare('SELECT COUNT(*) AS c FROM url_runs').get() as { c: number }).c).toBe(0);
    });
  });

  describe('urlRemove', () => {
    it('throws when a run is open', () => {
      addUrl(urlsRepo, 'https://example.com/a');
      runStart(runsRepo, urlsRepo, urlRunsRepo, () => ({ pid: 4242 }));

      expect(() => urlRemove(runsRepo, urlsRepo, 'https://example.com/a')).toThrow(
        'run 1 is still open',
      );
    });

    it("removes an existing url and returns 'removed'", () => {
      addUrl(urlsRepo, 'https://example.com/a');

      expect(urlRemove(runsRepo, urlsRepo, 'https://example.com/a')).toBe('removed');
      expect((db.prepare('SELECT COUNT(*) AS c FROM urls').get() as { c: number }).c).toBe(0);
    });

    it("returns 'not-found' for a url that does not exist", () => {
      expect(urlRemove(runsRepo, urlsRepo, 'https://example.com/missing')).toBe('not-found');
    });
  });

  describe('urlClear', () => {
    it('throws when a run is open', () => {
      addUrl(urlsRepo, 'https://example.com/a');
      runStart(runsRepo, urlsRepo, urlRunsRepo, () => ({ pid: 4242 }));

      expect(() => urlClear(runsRepo, urlsRepo)).toThrow('run 1 is still open');
    });

    it('deletes all urls and returns the count', () => {
      addUrl(urlsRepo, 'https://example.com/a');
      addUrl(urlsRepo, 'https://example.com/b');

      expect(urlClear(runsRepo, urlsRepo)).toBe(2);
      expect((db.prepare('SELECT COUNT(*) AS c FROM urls').get() as { c: number }).c).toBe(0);
    });
  });

  describe('urlList', () => {
    it('returns registered urls with their created_at timestamp', () => {
      addUrl(urlsRepo, 'https://example.com/a');

      expect(urlList(urlsRepo)).toEqual([
        { url: 'https://example.com/a', createdAt: expect.any(Number) },
      ]);
    });
  });

  describe('runStop', () => {
    it('kills the process, deletes url_runs, marks the run abandoned', () => {
      addUrl(urlsRepo, 'https://example.com/a');
      const { pid } = runStart(runsRepo, urlsRepo, urlRunsRepo, () => ({ pid: 4242 }));
      const run = db.prepare('SELECT id FROM runs').get() as { id: string };
      const killed: number[] = [];

      runStop(runsRepo, urlRunsRepo, (killPid) => {
        killed.push(killPid);
      });

      expect(killed).toEqual([pid]);
      expect(runStatus(run.id)).toBe('abandoned');
      expect(urlRunCount(run.id)).toBe(0);
    });

    it("throws 'process not found, use run reset' when kill fails with ESRCH", () => {
      addUrl(urlsRepo, 'https://example.com/a');
      runStart(runsRepo, urlsRepo, urlRunsRepo, () => ({ pid: 4242 }));

      expect(() =>
        runStop(runsRepo, urlRunsRepo, () => {
          throw Object.assign(new Error('kill ESRCH'), { code: 'ESRCH' });
        }),
      ).toThrow('process not found, use run reset');
    });

    it("throws 'no open run' when there is no open run", () => {
      expect(() => runStop(runsRepo, urlRunsRepo, () => {})).toThrow('no open run');
    });
  });

  describe('runReset', () => {
    it('deletes url_runs and marks the run abandoned, without killing anything', () => {
      addUrl(urlsRepo, 'https://example.com/a');
      runStart(runsRepo, urlsRepo, urlRunsRepo, () => ({ pid: 4242 }));
      const openRun = db.prepare('SELECT id FROM runs').get() as { id: string };

      runReset(runsRepo, urlRunsRepo);

      expect(runStatus(openRun.id)).toBe('abandoned');
      expect(urlRunCount(openRun.id)).toBe(0);
    });

    it("throws 'no open run' when there is no open run", () => {
      expect(() => runReset(runsRepo, urlRunsRepo)).toThrow('no open run');
    });
  });

  describe('abandonRun', () => {
    it('does not overwrite a run already marked done (abandoned-race guard)', () => {
      const runId = randomUUID();
      db.prepare("INSERT INTO runs (id, version, status) VALUES (?, ?, 'done')").run(runId, 1);

      abandonRun(runsRepo, urlRunsRepo, runId);

      expect(runStatus(runId)).toBe('done');
    });
  });
});
