import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type Database from 'better-sqlite3';
import pino from 'pino';
import { type Browser, chromium } from 'playwright';
import { CONFIG_PATH, DB_PATH, LOG_DIR, SNAPSHOT_DIR } from './config';
import { migrate, openDb } from './db';
import { scrape } from './scraper';
import { slug } from './slug';
import type { Config, UrlRun } from './types';

type Logger = { error: (obj: unknown, msg: string) => void };
type ScrapeFn = typeof scrape;

export interface OpenRun {
  id: string;
  version: number;
}

export function findOpenRun(db: Database.Database): OpenRun | undefined {
  return db.prepare("SELECT id, version FROM runs WHERE status = 'open'").get() as
    | OpenRun
    | undefined;
}

export function claimNextPending(db: Database.Database, runId: string): UrlRun | undefined {
  const candidate = db
    .prepare(
      "SELECT id FROM url_runs WHERE run_id = ? AND status = 'pending' ORDER BY created_at LIMIT 1",
    )
    .get(runId) as { id: string } | undefined;

  if (!candidate) {
    return undefined;
  }

  return db
    .prepare(
      "UPDATE url_runs SET status = 'processing' WHERE id = ? AND status = 'pending' RETURNING *",
    )
    .get(candidate.id) as UrlRun | undefined;
}

export function countPending(db: Database.Database, runId: string): number {
  return (
    db
      .prepare("SELECT COUNT(*) AS c FROM url_runs WHERE run_id = ? AND status = 'pending'")
      .get(runId) as { c: number }
  ).c;
}

export function finalizeRun(db: Database.Database, runId: string): 0 | 1 {
  const failed = (
    db
      .prepare("SELECT COUNT(*) AS c FROM url_runs WHERE run_id = ? AND status = 'failed'")
      .get(runId) as { c: number }
  ).c;

  db.prepare('DELETE FROM url_runs WHERE run_id = ?').run(runId);
  db.prepare("UPDATE runs SET status = 'done' WHERE id = ? AND status = 'open'").run(runId);

  return failed > 0 ? 1 : 0;
}

export async function processUrlRun(
  db: Database.Database,
  browser: Browser,
  urlRun: UrlRun,
  version: number,
  snapshotBaseDir: string,
  config: Config,
  scrapeFn: ScrapeFn,
  logger: Logger,
): Promise<void> {
  const urlRow = db.prepare('SELECT url, path FROM urls WHERE id = ?').get(urlRun.url_id) as {
    url: string;
    path: string;
  };
  const snapshotDir = path.join(
    snapshotBaseDir,
    `version-${version}`,
    slug(urlRow.url, urlRow.path),
  );

  try {
    await scrapeFn(browser, { url: urlRow.url, version, snapshotDir, config });
    db.prepare("UPDATE url_runs SET status = 'done' WHERE id = ?").run(urlRun.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    db.prepare("UPDATE url_runs SET status = 'failed', error = ? WHERE id = ?").run(
      message,
      urlRun.id,
    );
    logger.error({ url: urlRow.url, error: message }, 'scrape failed');
  }
}

interface WorkerDeps {
  scrapeFn?: ScrapeFn;
  sleepFn?: (ms: number) => Promise<void>;
  logger?: Logger;
}

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function runWorker(
  db: Database.Database,
  browser: Browser,
  run: OpenRun,
  snapshotBaseDir: string,
  config: Config,
  deps: WorkerDeps = {},
): Promise<0 | 1> {
  const scrapeFn = deps.scrapeFn ?? scrape;
  const sleepFn = deps.sleepFn ?? defaultSleep;
  const logger = deps.logger ?? { error: () => {} };

  for (;;) {
    const claimed = claimNextPending(db, run.id);
    if (claimed) {
      await processUrlRun(
        db,
        browser,
        claimed,
        run.version,
        snapshotBaseDir,
        config,
        scrapeFn,
        logger,
      );
      continue;
    }

    if (countPending(db, run.id) === 0) {
      break;
    }

    await sleepFn(500);
  }

  return finalizeRun(db, run.id);
}

export function loadWorkerConfig(configPath: string): Config {
  if (!fs.existsSync(configPath)) {
    return {};
  }

  const raw = fs.readFileSync(configPath, 'utf-8');
  try {
    return JSON.parse(raw) as Config;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`invalid config JSON at ${configPath}: ${reason}`);
  }
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  void (async () => {
    const db = openDb(DB_PATH);
    migrate(db);

    const run = findOpenRun(db);
    if (!run) {
      console.error('no open run');
      db.close();
      process.exitCode = 1;
      return;
    }

    let config: Config;
    try {
      config = loadWorkerConfig(CONFIG_PATH);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      db.close();
      process.exitCode = 1;
      return;
    }

    fs.mkdirSync(LOG_DIR, { recursive: true });
    const logger = pino(pino.destination(path.join(LOG_DIR, `worker-v${run.version}.log`)));

    const browser = await chromium.launch({ headless: config.headless ?? true });

    try {
      process.exitCode = await runWorker(db, browser, run, SNAPSHOT_DIR, config, { logger });
    } finally {
      await browser.close();
      db.close();
    }
  })();
}
