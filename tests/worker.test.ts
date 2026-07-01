import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { migrate, openDb } from '../src/db';
import {
  claimNextPending,
  findOpenRun,
  finalizeRun,
  loadWorkerConfig,
  processUrlRun,
  runWorker,
} from '../src/worker';
import type { UrlRun } from '../src/types';

function insertUrl(db: Database.Database, url = 'https://example.com/a'): string {
  const id = randomUUID();
  db.prepare('INSERT INTO urls (id, url, path) VALUES (?, ?, ?)').run(id, url, new URL(url).pathname);
  return id;
}

function insertRun(db: Database.Database, status: 'open' | 'done' | 'abandoned' = 'open'): {
  id: string;
  version: number;
} {
  const id = randomUUID();
  db.prepare('INSERT INTO runs (id, version, status) VALUES (?, 1, ?)').run(id, status);
  return { id, version: 1 };
}

function insertUrlRun(
  db: Database.Database,
  urlId: string,
  runId: string,
  status: 'pending' | 'processing' | 'done' | 'failed' = 'pending',
): string {
  const id = randomUUID();
  db.prepare('INSERT INTO url_runs (id, url_id, run_id, status) VALUES (?, ?, ?, ?)').run(
    id,
    urlId,
    runId,
    status,
  );
  return id;
}

function getUrlRun(db: Database.Database, id: string): UrlRun {
  return db.prepare('SELECT * FROM url_runs WHERE id = ?').get(id) as UrlRun;
}

describe('findOpenRun', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = openDb(':memory:');
    migrate(db);
  });

  afterEach(() => {
    db.close();
  });

  it('returns undefined when no open run exists', () => {
    expect(findOpenRun(db)).toBeUndefined();
  });

  it('returns the open run id and version when one exists', () => {
    const run = insertRun(db, 'open');

    expect(findOpenRun(db)).toEqual({ id: run.id, version: run.version });
  });
});

describe('claimNextPending', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = openDb(':memory:');
    migrate(db);
  });

  afterEach(() => {
    db.close();
  });

  it('claims a pending row, sets status to processing, and returns it', () => {
    const run = insertRun(db);
    const urlId = insertUrl(db);
    const urlRunId = insertUrlRun(db, urlId, run.id, 'pending');

    const claimed = claimNextPending(db, run.id);

    expect(claimed?.id).toBe(urlRunId);
    expect(claimed?.status).toBe('processing');
    expect(getUrlRun(db, urlRunId).status).toBe('processing');
  });

  it('returns undefined when no pending rows remain for the run', () => {
    const run = insertRun(db);

    expect(claimNextPending(db, run.id)).toBeUndefined();
  });

  it('only one connection can claim a given pending row (atomic claim race)', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-worker-'));
    const dbPath = path.join(tmpDir, 'voyager.db');

    const dbA = openDb(dbPath);
    migrate(dbA);
    const run = insertRun(dbA);
    const urlId = insertUrl(dbA);
    const urlRunId = insertUrlRun(dbA, urlId, run.id, 'pending');

    const dbB = openDb(dbPath);

    try {
      const claimedByA = claimNextPending(dbA, run.id);
      const claimedByB = claimNextPending(dbB, run.id);

      expect(claimedByA?.id).toBe(urlRunId);
      expect(claimedByB).toBeUndefined();
    } finally {
      dbA.close();
      dbB.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

describe('finalizeRun', () => {
  let db: Database.Database;
  let tmpDir: string;

  beforeEach(() => {
    db = openDb(':memory:');
    migrate(db);
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-worker-finalize-'));
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('deletes url_runs and marks run done when run was open, returns 0 when nothing failed', () => {
    const run = insertRun(db, 'open');
    const urlId = insertUrl(db);
    insertUrlRun(db, urlId, run.id, 'done');

    const exitCode = finalizeRun(db, run.id, run.version, tmpDir);

    expect(exitCode).toBe(0);
    expect(db.prepare('SELECT COUNT(*) c FROM url_runs WHERE run_id = ?').get(run.id)).toEqual({
      c: 0,
    });
    expect(
      (db.prepare('SELECT status FROM runs WHERE id = ?').get(run.id) as { status: string })
        .status,
    ).toBe('done');
  });

  it('returns 1 when a url_run failed before finalizing', () => {
    const run = insertRun(db, 'open');
    const urlId = insertUrl(db);
    insertUrlRun(db, urlId, run.id, 'failed');

    expect(finalizeRun(db, run.id, run.version, tmpDir)).toBe(1);
  });

  it('does not overwrite an abandoned run back to done', () => {
    const run = insertRun(db, 'abandoned');
    const urlId = insertUrl(db);
    insertUrlRun(db, urlId, run.id, 'done');

    finalizeRun(db, run.id, run.version, tmpDir);

    expect(
      (db.prepare('SELECT status FROM runs WHERE id = ?').get(run.id) as { status: string })
        .status,
    ).toBe('abandoned');
  });

  it('writes errors.json and sets done_with_errors when a url_run failed (V9)', () => {
    const run = insertRun(db, 'open');
    const urlId = insertUrl(db, 'https://example.com/broken');
    insertUrlRun(db, urlId, run.id, 'failed');
    db.prepare("UPDATE url_runs SET error = 'boom' WHERE run_id = ?").run(run.id);

    const exitCode = finalizeRun(db, run.id, run.version, tmpDir);

    expect(exitCode).toBe(1);
    expect(
      (db.prepare('SELECT status FROM runs WHERE id = ?').get(run.id) as { status: string })
        .status,
    ).toBe('done_with_errors');
    const errorsPath = path.join(tmpDir, `version-${run.version}`, 'errors.json');
    const errors = JSON.parse(fs.readFileSync(errorsPath, 'utf-8'));
    expect(errors).toEqual([{ url: 'https://example.com/broken', error: 'boom' }]);
  });

  it('does not write errors.json and keeps done when no url_run failed (V9)', () => {
    const run = insertRun(db, 'open');
    const urlId = insertUrl(db);
    insertUrlRun(db, urlId, run.id, 'done');

    finalizeRun(db, run.id, run.version, tmpDir);

    expect(
      (db.prepare('SELECT status FROM runs WHERE id = ?').get(run.id) as { status: string })
        .status,
    ).toBe('done');
    expect(fs.existsSync(path.join(tmpDir, `version-${run.version}`, 'errors.json'))).toBe(false);
  });
});

describe('processUrlRun', () => {
  let db: Database.Database;
  let tmpDir: string;

  beforeEach(() => {
    db = openDb(':memory:');
    migrate(db);
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-worker-snap-'));
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('marks the url_run done when scrapeFn succeeds', async () => {
    const run = insertRun(db);
    const urlId = insertUrl(db);
    const urlRunId = insertUrlRun(db, urlId, run.id, 'processing');
    const urlRun = getUrlRun(db, urlRunId);
    const scrapeFn = vi.fn().mockResolvedValue({});
    const logger = { error: vi.fn() };

    await processUrlRun(db, {} as never, urlRun, run.version, tmpDir, {}, scrapeFn, logger);

    expect(getUrlRun(db, urlRunId).status).toBe('done');
    expect(scrapeFn).toHaveBeenCalledOnce();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('marks the url_run failed, records the error, and logs when scrapeFn throws', async () => {
    const run = insertRun(db);
    const urlId = insertUrl(db);
    const urlRunId = insertUrlRun(db, urlId, run.id, 'processing');
    const urlRun = getUrlRun(db, urlRunId);
    const scrapeFn = vi.fn().mockRejectedValue(new Error('boom'));
    const logger = { error: vi.fn() };

    await processUrlRun(db, {} as never, urlRun, run.version, tmpDir, {}, scrapeFn, logger);

    const updated = getUrlRun(db, urlRunId);
    expect(updated.status).toBe('failed');
    expect(updated.error).toBe('boom');
    expect(logger.error).toHaveBeenCalledOnce();
  });
});

describe('runWorker', () => {
  let db: Database.Database;
  let tmpDir: string;

  beforeEach(() => {
    db = openDb(':memory:');
    migrate(db);
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-worker-run-'));
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('processes every pending url_run and returns 0 when all succeed', async () => {
    const run = insertRun(db);
    const urlA = insertUrl(db, 'https://example.com/a');
    const urlB = insertUrl(db, 'https://example.com/b');
    insertUrlRun(db, urlA, run.id, 'pending');
    insertUrlRun(db, urlB, run.id, 'pending');
    const scrapeFn = vi.fn().mockResolvedValue({});
    const sleepFn = vi.fn().mockResolvedValue(undefined);
    const logger = { error: vi.fn() };

    const exitCode = await runWorker(db, {} as never, run, tmpDir, {}, {
      scrapeFn,
      sleepFn,
      logger,
    });

    expect(exitCode).toBe(0);
    expect(scrapeFn).toHaveBeenCalledTimes(2);
    expect(db.prepare('SELECT COUNT(*) c FROM url_runs WHERE run_id = ?').get(run.id)).toEqual({
      c: 0,
    });
  });

  it('returns 1 when at least one scrapeFn call rejects', async () => {
    const run = insertRun(db);
    const urlA = insertUrl(db, 'https://example.com/a');
    const urlB = insertUrl(db, 'https://example.com/b');
    insertUrlRun(db, urlA, run.id, 'pending');
    insertUrlRun(db, urlB, run.id, 'pending');
    const scrapeFn = vi
      .fn()
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('fail'));
    const sleepFn = vi.fn().mockResolvedValue(undefined);
    const logger = { error: vi.fn() };

    const exitCode = await runWorker(db, {} as never, run, tmpDir, {}, {
      scrapeFn,
      sleepFn,
      logger,
    });

    expect(exitCode).toBe(1);
  });

  it('never calls sleepFn when there is no contention', async () => {
    const run = insertRun(db);
    const urlId = insertUrl(db);
    insertUrlRun(db, urlId, run.id, 'pending');
    const scrapeFn = vi.fn().mockResolvedValue({});
    const sleepFn = vi.fn().mockResolvedValue(undefined);
    const logger = { error: vi.fn() };

    await runWorker(db, {} as never, run, tmpDir, {}, { scrapeFn, sleepFn, logger });

    expect(sleepFn).not.toHaveBeenCalled();
  });
});

describe('loadWorkerConfig', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-worker-config-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns {} when the config file is missing', () => {
    expect(loadWorkerConfig(path.join(tmpDir, 'missing.json'))).toEqual({});
  });

  it('parses a valid config JSON file', () => {
    const configPath = path.join(tmpDir, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({ headless: false }));

    expect(loadWorkerConfig(configPath)).toEqual({ headless: false });
  });

  it('throws a descriptive error when the config JSON is invalid', () => {
    const configPath = path.join(tmpDir, 'config.json');
    fs.writeFileSync(configPath, '{ not json');

    expect(() => loadWorkerConfig(configPath)).toThrow(configPath);
  });
});
