import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { migrate, openDb } from '../src/db';
import { pageSlug } from '../src/slug';

describe('openDb', () => {
  let tmpDir: string;
  let dbPath: string;
  let db: Database.Database;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-db-'));
    dbPath = path.join(tmpDir, 'test.db');
  });

  afterEach(() => {
    db?.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('sets journal_mode to WAL on open', () => {
    db = openDb(dbPath);

    expect(db.pragma('journal_mode', { simple: true })).toBe('wal');
  });

  it('sets busy_timeout to 5000ms on open', () => {
    db = openDb(dbPath);

    expect(db.pragma('busy_timeout', { simple: true })).toBe(5000);
  });

  it('sets foreign_keys pragma to ON (1) on open', () => {
    db = openDb(dbPath);

    expect(db.pragma('foreign_keys', { simple: true })).toBe(1);
  });

  it('opens successfully against an in-memory/temp-file database', () => {
    expect(() => {
      db = openDb(':memory:');
    }).not.toThrow();
  });

  it('creates missing nested parent directories for DB_PATH and does not throw', () => {
    const nestedDbPath = path.join(tmpDir, 'nested', 'deep', 'test.db');

    expect(() => {
      db = openDb(nestedDbPath);
    }).not.toThrow();

    expect(fs.existsSync(path.dirname(nestedDbPath))).toBe(true);
    expect(fs.existsSync(nestedDbPath)).toBe(true);
  });
});

describe('migrate', () => {
  let tmpDir: string;
  let dbPath: string;
  let db: Database.Database;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-db-'));
    dbPath = path.join(tmpDir, 'test.db');
    db = openDb(dbPath);
    migrate(db);
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function tableNames(): string[] {
    return db
      .prepare<[], { name: string }>("SELECT name FROM sqlite_master WHERE type='table'")
      .all()
      .map((row) => row.name);
  }

  function insertUrl(url: string, urlPath = '/'): string {
    const id = randomUUID();
    db.prepare('INSERT INTO urls (id, url, path) VALUES (?, ?, ?)').run(id, url, urlPath);
    return id;
  }

  function insertRun(version: number): string {
    const id = randomUUID();
    db.prepare('INSERT INTO runs (id, version) VALUES (?, ?)').run(id, version);
    return id;
  }

  it('migrate() creates urls, runs, and url_runs tables', () => {
    const names = tableNames();

    expect(names).toEqual(expect.arrayContaining(['urls', 'runs', 'url_runs']));
  });

  it('rejects duplicate urls.url via UNIQUE constraint', () => {
    insertUrl('https://example.com/a');

    expect(() => insertUrl('https://example.com/a')).toThrow();
  });

  it('rejects duplicate runs.version via UNIQUE constraint', () => {
    insertRun(1);

    expect(() => insertRun(1)).toThrow();
  });

  it('rejects duplicate (url_id, run_id) pair via UNIQUE constraint', () => {
    const urlId = insertUrl('https://example.com/b');
    const runId = insertRun(1);
    const insertUrlRun = () =>
      db
        .prepare('INSERT INTO url_runs (id, url_id, run_id) VALUES (?, ?, ?)')
        .run(randomUUID(), urlId, runId);

    insertUrlRun();

    expect(insertUrlRun).toThrow();
  });

  it('rejects url_runs insert with nonexistent url_id (FK)', () => {
    const runId = insertRun(1);

    expect(() =>
      db
        .prepare('INSERT INTO url_runs (id, url_id, run_id) VALUES (?, ?, ?)')
        .run(randomUUID(), randomUUID(), runId),
    ).toThrow();
  });

  it('rejects url_runs insert with nonexistent run_id (FK)', () => {
    const urlId = insertUrl('https://example.com/c');

    expect(() =>
      db
        .prepare('INSERT INTO url_runs (id, url_id, run_id) VALUES (?, ?, ?)')
        .run(randomUUID(), urlId, randomUUID()),
    ).toThrow();
  });

  // B8/V28: db.ts must delegate the legacy page_slug backfill to a repo, not
  // run raw SQL itself. Simulates a pre-existing row left with the migration's
  // placeholder page_slug='' and re-invokes migrate() to trigger the backfill.
  it('migrate() backfills host/query_string/page_slug for rows left with the placeholder page_slug', () => {
    const id = randomUUID();
    db.prepare(
      "INSERT INTO urls (id, url, host, path, query_string, page_slug) VALUES (?, ?, '', ?, '', '')",
    ).run(id, 'https://example.com/a/b?x=1', '/a/b');

    migrate(db);

    const row = db.prepare('SELECT host, query_string, page_slug FROM urls WHERE id = ?').get(id) as {
      host: string;
      query_string: string;
      page_slug: string;
    };
    expect(row).toEqual({
      host: 'example.com',
      query_string: 'x=1',
      page_slug: pageSlug('/a/b', 'x=1'),
    });
  });
});

// V28: src/db.ts is connection factory + migration only — no raw query logic.
// grep -rn "\.prepare(" src/db.ts must return 0 hits (same contract as T44).
describe('db.ts source — architecture (V28)', () => {
  it('contains no raw db.prepare()/.exec() calls', () => {
    const dbTsPath = fileURLToPath(new URL('../src/db.ts', import.meta.url));
    const source = fs.readFileSync(dbTsPath, 'utf-8');

    expect(source).not.toMatch(/\.prepare\(/);
    expect(source).not.toMatch(/\.exec\(/);
  });
});
