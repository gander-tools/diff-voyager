import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { migrate, openDb, toDrizzle } from '../../src/db';
import { DrizzleRunsRepo, type RunsRepo } from '../../src/repos/runsRepo';

function insertUrl(db: Database.Database, url = 'https://example.com/a'): string {
  const id = randomUUID();
  db.prepare('INSERT INTO urls (id, url, path) VALUES (?, ?, ?)').run(
    id,
    url,
    new URL(url).pathname,
  );
  return id;
}

function insertRun(
  db: Database.Database,
  status: 'open' | 'done' | 'done_with_errors' | 'abandoned' = 'open',
  version = 1,
): string {
  const id = randomUUID();
  db.prepare('INSERT INTO runs (id, version, status) VALUES (?, ?, ?)').run(id, version, status);
  return id;
}

function urlRunCount(db: Database.Database, runId: string): number {
  return (
    db.prepare('SELECT COUNT(*) AS c FROM url_runs WHERE run_id = ?').get(runId) as { c: number }
  ).c;
}

function runStatus(db: Database.Database, runId: string): string {
  return (db.prepare('SELECT status FROM runs WHERE id = ?').get(runId) as { status: string })
    .status;
}

describe('RunsRepo', () => {
  let tmpDir: string;
  let db: Database.Database;
  let repo: RunsRepo;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-runsrepo-'));
    db = openDb(path.join(tmpDir, 'test.db'));
    migrate(db);
    repo = new DrizzleRunsRepo(toDrizzle(db));
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('findOpenRun', () => {
    it('returns undefined when no run exists', () => {
      expect(repo.findOpenRun()).toBeUndefined();
    });

    it('returns undefined when the only run is not open', () => {
      insertRun(db, 'done');
      expect(repo.findOpenRun()).toBeUndefined();
    });

    it('returns the RunRecord for the open run', () => {
      const id = insertRun(db, 'open', 3);
      const found = repo.findOpenRun();
      expect(found).toEqual({
        id,
        version: 3,
        status: 'open',
        pid: null,
        created_at: expect.any(Number),
      });
    });
  });

  describe('insertRunWithUrlRuns', () => {
    it('creates a run row with version 1 and status open when no runs exist', () => {
      insertUrl(db);
      const { id, version } = repo.insertRunWithUrlRuns();
      expect(version).toBe(1);
      expect(runStatus(db, id)).toBe('open');
    });

    it('computes version as COALESCE(MAX(version),0)+1', () => {
      insertUrl(db);
      insertRun(db, 'done', 5);
      const { version } = repo.insertRunWithUrlRuns();
      expect(version).toBe(6);
    });

    it('creates a url_run for every registered url', () => {
      insertUrl(db, 'https://example.com/a');
      insertUrl(db, 'https://example.com/b');
      const { id } = repo.insertRunWithUrlRuns();
      expect(urlRunCount(db, id)).toBe(2);
    });
  });

  describe('updatePid', () => {
    it('persists the pid on the run row', () => {
      const runId = insertRun(db, 'open');
      repo.updatePid(runId, 4242);
      const row = db.prepare('SELECT pid FROM runs WHERE id = ?').get(runId) as { pid: number };
      expect(row.pid).toBe(4242);
    });
  });

  describe('deleteRun', () => {
    it('deletes the run row', () => {
      const runId = insertRun(db, 'open');
      repo.deleteRun(runId);
      const row = db.prepare('SELECT id FROM runs WHERE id = ?').get(runId);
      expect(row).toBeUndefined();
    });
  });

  describe('markAbandoned', () => {
    it('sets status to abandoned when the run is open', () => {
      const runId = insertRun(db, 'open');
      repo.markAbandoned(runId);
      expect(runStatus(db, runId)).toBe('abandoned');
    });

    it('does not overwrite a run already marked done', () => {
      const runId = insertRun(db, 'done');
      repo.markAbandoned(runId);
      expect(runStatus(db, runId)).toBe('done');
    });
  });

  describe('markDone', () => {
    it('sets status to done when the run is open', () => {
      const runId = insertRun(db, 'open');
      repo.markDone(runId);
      expect(runStatus(db, runId)).toBe('done');
    });

    it('does not overwrite a run already marked abandoned', () => {
      const runId = insertRun(db, 'abandoned');
      repo.markDone(runId);
      expect(runStatus(db, runId)).toBe('abandoned');
    });
  });

  describe('markDoneWithErrors', () => {
    it('sets status to done_with_errors when the run is open', () => {
      const runId = insertRun(db, 'open');
      repo.markDoneWithErrors(runId);
      expect(runStatus(db, runId)).toBe('done_with_errors');
    });

    it('does not overwrite a run already marked abandoned', () => {
      const runId = insertRun(db, 'abandoned');
      repo.markDoneWithErrors(runId);
      expect(runStatus(db, runId)).toBe('abandoned');
    });
  });
});
