import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { migrate, openDb, toDrizzle } from '../../src/db';
import { DrizzleUrlRunsRepo, type UrlRunsRepo } from '../../src/repos/urlRunsRepo';

function insertUrl(db: Database.Database, url = 'https://example.com/a'): string {
  const id = randomUUID();
  db.prepare('INSERT INTO urls (id, url, path) VALUES (?, ?, ?)').run(
    id,
    url,
    new URL(url).pathname,
  );
  return id;
}

function insertRun(db: Database.Database, version = 1): string {
  const id = randomUUID();
  db.prepare('INSERT INTO runs (id, version) VALUES (?, ?)').run(id, version);
  return id;
}

function insertUrlRun(
  db: Database.Database,
  urlId: string,
  runId: string,
  status: 'pending' | 'processing' | 'done' | 'failed' = 'pending',
  error: string | null = null,
): string {
  const id = randomUUID();
  db.prepare('INSERT INTO url_runs (id, url_id, run_id, status, error) VALUES (?, ?, ?, ?, ?)').run(
    id,
    urlId,
    runId,
    status,
    error,
  );
  return id;
}

function urlRunStatus(db: Database.Database, id: string): string {
  return (db.prepare('SELECT status FROM url_runs WHERE id = ?').get(id) as { status: string })
    .status;
}

describe('UrlRunsRepo', () => {
  let tmpDir: string;
  let db: Database.Database;
  let repo: UrlRunsRepo;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-urlrunsrepo-'));
    db = openDb(path.join(tmpDir, 'test.db'));
    migrate(db);
    repo = new DrizzleUrlRunsRepo(toDrizzle(db));
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('claimNextPending', () => {
    it('returns undefined when no pending rows remain for the run', () => {
      const runId = insertRun(db);
      expect(repo.claimNextPending(runId)).toBeUndefined();
    });

    it('atomically claims the oldest pending row and marks it processing', () => {
      const runId = insertRun(db);
      const urlId = insertUrl(db);
      const urlRunId = insertUrlRun(db, urlId, runId, 'pending');

      const claimed = repo.claimNextPending(runId);

      expect(claimed?.id).toBe(urlRunId);
      expect(claimed?.status).toBe('processing');
      expect(urlRunStatus(db, urlRunId)).toBe('processing');
    });

    it('only one connection can claim a given pending row (atomic claim race)', () => {
      const dbPath = path.join(tmpDir, 'race.db');
      const dbA = openDb(dbPath);
      migrate(dbA);
      const runId = insertRun(dbA);
      const urlId = insertUrl(dbA);
      const urlRunId = insertUrlRun(dbA, urlId, runId, 'pending');

      const dbB = openDb(dbPath);
      const repoA = new DrizzleUrlRunsRepo(toDrizzle(dbA));
      const repoB = new DrizzleUrlRunsRepo(toDrizzle(dbB));

      try {
        const claimedByA = repoA.claimNextPending(runId);
        const claimedByB = repoB.claimNextPending(runId);

        expect(claimedByA?.id).toBe(urlRunId);
        expect(claimedByB).toBeUndefined();
      } finally {
        dbA.close();
        dbB.close();
      }
    });

    it(
      'a connection whose selected candidate is claimed out from under it still succeeds on retry against the remaining pending row (V54)',
      () => {
        const dbPath = path.join(tmpDir, 'race-multi.db');
        const dbA = openDb(dbPath);
        migrate(dbA);
        const runId = insertRun(dbA);
        const urlIdA = insertUrl(dbA, 'https://example.com/a');
        const urlIdB = insertUrl(dbA, 'https://example.com/b');
        const urlRunIdA = insertUrlRun(dbA, urlIdA, runId, 'pending');
        const urlRunIdB = insertUrlRun(dbA, urlIdB, runId, 'pending');

        const dbB = openDb(dbPath);
        const repoA = new DrizzleUrlRunsRepo(toDrizzle(dbA));
        const repoB = new DrizzleUrlRunsRepo(toDrizzle(dbB));

        try {
          // B "selects" the oldest pending row (A) — mirrors claimNextPending's
          // internal SELECT step, before A's UPDATE below wins the row.
          const staleCandidateId = urlRunIdA;

          const claimedByA = repoA.claimNextPending(runId);
          expect(claimedByA?.id).toBe(urlRunIdA);

          // B's conditional UPDATE against its now-stale candidate must affect
          // 0 rows — this is what claimNextPending's internal update.get()
          // returns undefined for.
          const staleUpdate = dbB
            .prepare("UPDATE url_runs SET status = 'processing' WHERE id = ? AND status = 'pending'")
            .run(staleCandidateId);
          expect(staleUpdate.changes).toBe(0);

          // The public retry (what runWorker's loop does on a lost claim)
          // must make progress on the remaining pending row, not stay stuck.
          const claimedByBRetry = repoB.claimNextPending(runId);
          expect(claimedByBRetry?.id).toBe(urlRunIdB);
          expect(claimedByBRetry?.status).toBe('processing');
        } finally {
          dbA.close();
          dbB.close();
        }
      },
    );
  });

  describe('countPending', () => {
    it('counts only pending rows for the given run', () => {
      const runId = insertRun(db);
      const urlIdA = insertUrl(db, 'https://example.com/a');
      const urlIdB = insertUrl(db, 'https://example.com/b');
      insertUrlRun(db, urlIdA, runId, 'pending');
      insertUrlRun(db, urlIdB, runId, 'done');

      expect(repo.countPending(runId)).toBe(1);
    });
  });

  describe('listFailed', () => {
    it('returns url + error for every failed row in the run', () => {
      const runId = insertRun(db);
      const urlId = insertUrl(db, 'https://example.com/fail');
      insertUrlRun(db, urlId, runId, 'failed', 'boom');

      expect(repo.listFailed(runId)).toEqual([
        { url: 'https://example.com/fail', error: 'boom' },
      ]);
    });

    it('excludes non-failed rows', () => {
      const runId = insertRun(db);
      const urlId = insertUrl(db);
      insertUrlRun(db, urlId, runId, 'done');

      expect(repo.listFailed(runId)).toEqual([]);
    });
  });

  describe('markDone', () => {
    it('sets status to done', () => {
      const runId = insertRun(db);
      const urlId = insertUrl(db);
      const id = insertUrlRun(db, urlId, runId, 'processing');

      repo.markDone(id);

      expect(urlRunStatus(db, id)).toBe('done');
    });
  });

  describe('markFailed', () => {
    it('sets status to failed and persists the error message', () => {
      const runId = insertRun(db);
      const urlId = insertUrl(db);
      const id = insertUrlRun(db, urlId, runId, 'processing');

      repo.markFailed(id, 'network timeout');

      expect(urlRunStatus(db, id)).toBe('failed');
      const row = db.prepare('SELECT error FROM url_runs WHERE id = ?').get(id) as {
        error: string;
      };
      expect(row.error).toBe('network timeout');
    });
  });

  describe('bulkInsert', () => {
    it('creates a pending url_run for every given url id', () => {
      const runId = insertRun(db);
      const urlIdA = insertUrl(db, 'https://example.com/a');
      const urlIdB = insertUrl(db, 'https://example.com/b');

      repo.bulkInsert(runId, [urlIdA, urlIdB]);

      const rows = db.prepare('SELECT status FROM url_runs WHERE run_id = ?').all(runId) as {
        status: string;
      }[];
      expect(rows).toHaveLength(2);
      expect(rows.every((row) => row.status === 'pending')).toBe(true);
    });
  });

  describe('deleteByRun', () => {
    it('deletes every url_run row for the given run', () => {
      const runId = insertRun(db);
      const urlId = insertUrl(db);
      insertUrlRun(db, urlId, runId, 'done');

      repo.deleteByRun(runId);

      const count = (
        db.prepare('SELECT COUNT(*) AS c FROM url_runs WHERE run_id = ?').get(runId) as {
          c: number;
        }
      ).c;
      expect(count).toBe(0);
    });
  });
});
