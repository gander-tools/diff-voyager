import fs from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import type Database from 'better-sqlite3';
import { type Browser, chromium } from 'playwright';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { addUrl, runStart } from '../src/cli';
import { migrate, openDb, toDrizzle } from '../src/db';
import { DrizzleRunsRepo, type RunsRepo } from '../src/repos/runsRepo';
import { DrizzleUrlRunsRepo, type UrlRunsRepo } from '../src/repos/urlRunsRepo';
import { DrizzleUrlsRepo, type UrlsRepo } from '../src/repos/urlsRepo';
import { slug } from '../src/slug';
import { findOpenRun, runWorker } from '../src/worker';

describe('e2e: add url -> run start -> worker processes', () => {
  let server: http.Server;
  let baseUrl: string;
  let browser: Browser;

  beforeAll(async () => {
    server = http.createServer((_req, res) => {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(
        '<html lang="en"><head><title>Integration Page</title></head><body><a href="/other">Other</a></body></html>',
      );
    });
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}/page`;

    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser.close();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

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
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-e2e-'));
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('wires cli+worker+db+scraper: writes snapshot artifacts and clears db state', async () => {
    expect(addUrl(urlsRepo, baseUrl)).toBe('added');

    const { version } = runStart(runsRepo, urlsRepo, urlRunsRepo, () => ({ pid: 4242 }));
    const run = findOpenRun(runsRepo);
    if (!run) {
      throw new Error('expected an open run after runStart');
    }

    const exitCode = await runWorker(runsRepo, urlsRepo, urlRunsRepo, browser, run, tmpDir, {});

    expect(exitCode).toBe(0);
    expect(
      db.prepare('SELECT COUNT(*) AS c FROM url_runs WHERE run_id = ?').get(run.id),
    ).toEqual({ c: 0 });
    expect(
      (db.prepare('SELECT status FROM runs WHERE id = ?').get(run.id) as { status: string })
        .status,
    ).toBe('done');

    const urlRow = db.prepare('SELECT path FROM urls WHERE url = ?').get(baseUrl) as {
      path: string;
    };
    const snapshotDir = path.join(tmpDir, `version-${version}`, slug(baseUrl, urlRow.path));

    const meta = JSON.parse(fs.readFileSync(path.join(snapshotDir, 'meta.json'), 'utf-8'));
    expect(meta).toMatchObject({
      url: baseUrl,
      version,
      title: 'Integration Page',
      lang: 'en',
      links: [{ href: '/other', text: 'Other', internal: true }],
    });

    expect(fs.readFileSync(path.join(snapshotDir, 'page.html'), 'utf-8')).toContain(
      'Integration Page',
    );
    expect(fs.readFileSync(path.join(snapshotDir, 'page.source.html'), 'utf-8')).toContain(
      'Integration Page',
    );
    expect(fs.existsSync(path.join(snapshotDir, 'screenshot.png'))).toBe(true);
    expect(fs.existsSync(path.join(snapshotDir, 'archive.har'))).toBe(true);
  });

  it('marks the url_run failed and still finalizes the run when navigation fails', async () => {
    const badUrl = 'http://127.0.0.1:1/unreachable';
    addUrl(urlsRepo, badUrl);

    const runResult = runStart(runsRepo, urlsRepo, urlRunsRepo, () => ({ pid: 4343 }));
    const run = findOpenRun(runsRepo);
    if (!run) {
      throw new Error('expected an open run after runStart');
    }

    const exitCode = await runWorker(runsRepo, urlsRepo, urlRunsRepo, browser, run, tmpDir, {});

    expect(exitCode).toBe(1);
    expect(
      db.prepare('SELECT COUNT(*) AS c FROM url_runs WHERE run_id = ?').get(run.id),
    ).toEqual({ c: 0 });
    expect(
      (db.prepare('SELECT status FROM runs WHERE id = ?').get(run.id) as { status: string })
        .status,
    ).toBe('done_with_errors');
    expect(runResult.version).toBeGreaterThan(0);

    const errors = JSON.parse(
      fs.readFileSync(path.join(tmpDir, `version-${run.version}`, 'errors.json'), 'utf-8'),
    );
    expect(errors).toEqual([{ url: badUrl, error: expect.any(String) }]);
  });
});
