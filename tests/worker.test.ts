import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { migrate, openDb, toDrizzle } from '../src/db';
import { DrizzleRunsRepo, type RunsRepo } from '../src/repos/runsRepo';
import { DrizzleUrlRunsRepo, type UrlRunsRepo } from '../src/repos/urlRunsRepo';
import { DrizzleUrlsRepo, type UrlsRepo } from '../src/repos/urlsRepo';
import { pageSlug } from '../src/slug';
import type { RunRecord, UrlRun } from '../src/types';
import { finalizeRun, loadWorkerConfig, processUrlRun, runWorker } from '../src/worker';

function insertUrl(db: Database.Database, url = 'https://example.com/a'): string {
  const id = randomUUID();
  const parsed = new URL(url);
  const path = parsed.pathname;
  const queryString = parsed.search.replace(/^\?/, '');
  db.prepare(
    'INSERT INTO urls (id, url, host, path, query_string, page_slug) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(id, url, parsed.host, path, queryString, pageSlug(path, queryString));
  return id;
}

function insertRun(
  db: Database.Database,
  status: 'open' | 'done' | 'abandoned' = 'open',
): RunRecord {
  const id = randomUUID();
  db.prepare('INSERT INTO runs (id, version, status) VALUES (?, 1, ?)').run(id, status);
  return db.prepare('SELECT * FROM runs WHERE id = ?').get(id) as RunRecord;
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


describe('finalizeRun', () => {
  let db: Database.Database;
  let runsRepo: RunsRepo;
  let urlRunsRepo: UrlRunsRepo;
  let tmpDir: string;

  beforeEach(() => {
    db = openDb(':memory:');
    migrate(db);
    const drizzleDb = toDrizzle(db);
    runsRepo = new DrizzleRunsRepo(drizzleDb);
    urlRunsRepo = new DrizzleUrlRunsRepo(drizzleDb);
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

    const exitCode = finalizeRun(runsRepo, urlRunsRepo, run.id, run.version, tmpDir);

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

    expect(finalizeRun(runsRepo, urlRunsRepo, run.id, run.version, tmpDir)).toBe(1);
  });

  it('does not overwrite an abandoned run back to done', () => {
    const run = insertRun(db, 'abandoned');
    const urlId = insertUrl(db);
    insertUrlRun(db, urlId, run.id, 'done');

    finalizeRun(runsRepo, urlRunsRepo, run.id, run.version, tmpDir);

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

    const exitCode = finalizeRun(runsRepo, urlRunsRepo, run.id, run.version, tmpDir);

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

    finalizeRun(runsRepo, urlRunsRepo, run.id, run.version, tmpDir);

    expect(
      (db.prepare('SELECT status FROM runs WHERE id = ?').get(run.id) as { status: string })
        .status,
    ).toBe('done');
    expect(fs.existsSync(path.join(tmpDir, `version-${run.version}`, 'errors.json'))).toBe(false);
  });
});

describe('processUrlRun', () => {
  let db: Database.Database;
  let urlsRepo: UrlsRepo;
  let urlRunsRepo: UrlRunsRepo;
  let tmpDir: string;

  beforeEach(() => {
    db = openDb(':memory:');
    migrate(db);
    const drizzleDb = toDrizzle(db);
    urlsRepo = new DrizzleUrlsRepo(drizzleDb);
    urlRunsRepo = new DrizzleUrlRunsRepo(drizzleDb);
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

    await processUrlRun(
      urlsRepo,
      urlRunsRepo,
      {} as never,
      urlRun,
      run.version,
      tmpDir,
      {},
      scrapeFn,
      logger,
    );

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

    await processUrlRun(
      urlsRepo,
      urlRunsRepo,
      {} as never,
      urlRun,
      run.version,
      tmpDir,
      {},
      scrapeFn,
      logger,
    );

    const updated = getUrlRun(db, urlRunId);
    expect(updated.status).toBe('failed');
    expect(updated.error).toBe('boom');
    expect(logger.error).toHaveBeenCalledOnce();
  });

  it('calls scrapeFn with the effective url (base-url origin + original path) when baseUrl is given (V34)', async () => {
    const run = insertRun(db);
    const urlId = insertUrl(db, 'https://example.com/a');
    const urlRunId = insertUrlRun(db, urlId, run.id, 'processing');
    const urlRow = db.prepare('SELECT page_slug FROM urls WHERE id = ?').get(urlId) as {
      page_slug: string;
    };
    const urlRun = getUrlRun(db, urlRunId);
    const scrapeFn = vi.fn().mockResolvedValue({});
    const logger = { error: vi.fn() };

    await processUrlRun(
      urlsRepo,
      urlRunsRepo,
      {} as never,
      urlRun,
      run.version,
      tmpDir,
      {},
      scrapeFn,
      logger,
      'https://cdn.example.com',
    );

    expect(scrapeFn).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ url: 'https://cdn.example.com/a' }),
    );
    expect(scrapeFn.mock.calls[0][1].snapshotDir).toBe(
      path.join(tmpDir, `version-${run.version}`, urlRow.page_slug),
    );
  });

  it('passes sourceUrl as the original url when baseUrl is given, distinct from the effective url', async () => {
    const run = insertRun(db);
    const urlId = insertUrl(db, 'https://example.com/a');
    const urlRunId = insertUrlRun(db, urlId, run.id, 'processing');
    const urlRun = getUrlRun(db, urlRunId);
    const scrapeFn = vi.fn().mockResolvedValue({});
    const logger = { error: vi.fn() };

    await processUrlRun(
      urlsRepo,
      urlRunsRepo,
      {} as never,
      urlRun,
      run.version,
      tmpDir,
      {},
      scrapeFn,
      logger,
      'https://cdn.example.com',
    );

    expect(scrapeFn).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        url: 'https://cdn.example.com/a',
        sourceUrl: 'https://example.com/a',
      }),
    );
  });

  it('builds the snapshot dir from the persisted page_slug, not a runtime slug computation (V14, V41)', async () => {
    const run = insertRun(db);
    const urlId = insertUrl(db, 'https://example.com/a/b?x=1');
    const urlRunId = insertUrlRun(db, urlId, run.id, 'processing');
    const urlRun = getUrlRun(db, urlRunId);
    const scrapeFn = vi.fn().mockResolvedValue({});
    const logger = { error: vi.fn() };

    await processUrlRun(
      urlsRepo,
      urlRunsRepo,
      {} as never,
      urlRun,
      run.version,
      tmpDir,
      {},
      scrapeFn,
      logger,
    );

    expect(scrapeFn.mock.calls[0][1].snapshotDir).toBe(
      path.join(tmpDir, `version-${run.version}`, pageSlug('/a/b', 'x=1')),
    );
  });

  it('calls scrapeFn with the original url unchanged when baseUrl is not given', async () => {
    const run = insertRun(db);
    const urlId = insertUrl(db, 'https://example.com/a');
    const urlRunId = insertUrlRun(db, urlId, run.id, 'processing');
    const urlRun = getUrlRun(db, urlRunId);
    const scrapeFn = vi.fn().mockResolvedValue({});
    const logger = { error: vi.fn() };

    await processUrlRun(
      urlsRepo,
      urlRunsRepo,
      {} as never,
      urlRun,
      run.version,
      tmpDir,
      {},
      scrapeFn,
      logger,
    );

    expect(scrapeFn).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ url: 'https://example.com/a' }),
    );
  });

  it('passes sourceUrl equal to url when baseUrl is not given', async () => {
    const run = insertRun(db);
    const urlId = insertUrl(db, 'https://example.com/a');
    const urlRunId = insertUrlRun(db, urlId, run.id, 'processing');
    const urlRun = getUrlRun(db, urlRunId);
    const scrapeFn = vi.fn().mockResolvedValue({});
    const logger = { error: vi.fn() };

    await processUrlRun(
      urlsRepo,
      urlRunsRepo,
      {} as never,
      urlRun,
      run.version,
      tmpDir,
      {},
      scrapeFn,
      logger,
    );

    expect(scrapeFn).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        url: 'https://example.com/a',
        sourceUrl: 'https://example.com/a',
      }),
    );
  });
});

describe('runWorker', () => {
  let db: Database.Database;
  let runsRepo: RunsRepo;
  let urlsRepo: UrlsRepo;
  let urlRunsRepo: UrlRunsRepo;
  let tmpDir: string;

  beforeEach(() => {
    db = openDb(':memory:');
    migrate(db);
    const drizzleDb = toDrizzle(db);
    runsRepo = new DrizzleRunsRepo(drizzleDb);
    urlsRepo = new DrizzleUrlsRepo(drizzleDb);
    urlRunsRepo = new DrizzleUrlRunsRepo(drizzleDb);
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

    const exitCode = await runWorker(
      runsRepo,
      urlsRepo,
      urlRunsRepo,
      {} as never,
      run,
      tmpDir,
      {},
      { scrapeFn, sleepFn, logger },
    );

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

    const exitCode = await runWorker(
      runsRepo,
      urlsRepo,
      urlRunsRepo,
      {} as never,
      run,
      tmpDir,
      {},
      { scrapeFn, sleepFn, logger },
    );

    expect(exitCode).toBe(1);
  });

  it('never calls sleepFn when there is no contention', async () => {
    const run = insertRun(db);
    const urlId = insertUrl(db);
    insertUrlRun(db, urlId, run.id, 'pending');
    const scrapeFn = vi.fn().mockResolvedValue({});
    const sleepFn = vi.fn().mockResolvedValue(undefined);
    const logger = { error: vi.fn() };

    await runWorker(
      runsRepo,
      urlsRepo,
      urlRunsRepo,
      {} as never,
      run,
      tmpDir,
      {},
      { scrapeFn, sleepFn, logger },
    );

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

  it.each([-1, 101])('throws when a tolerance value (%i) is out of range 0-100 (V68)', (bad) => {
    const configPath = path.join(tmpDir, 'config.json');
    fs.writeFileSync(
      configPath,
      JSON.stringify({ screenshot: { rules: { diff: { tolerance: { '*': bad } } } } }),
    );

    expect(() => loadWorkerConfig(configPath)).toThrow(configPath);
  });

  it('throws when a tolerance value is not an integer (V68)', () => {
    const configPath = path.join(tmpDir, 'config.json');
    fs.writeFileSync(
      configPath,
      JSON.stringify({ screenshot: { rules: { diff: { tolerance: { '*': 1.5 } } } } }),
    );

    expect(() => loadWorkerConfig(configPath)).toThrow(configPath);
  });

  it.each([0, 100, 95])('accepts an in-range integer tolerance value (%i) (V68)', (good) => {
    const configPath = path.join(tmpDir, 'config.json');
    fs.writeFileSync(
      configPath,
      JSON.stringify({ screenshot: { rules: { diff: { tolerance: { '*': good } } } } }),
    );

    expect(loadWorkerConfig(configPath)).toEqual({
      screenshot: { rules: { diff: { tolerance: { '*': good } } } },
    });
  });
});
