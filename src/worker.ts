import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pino from 'pino';
import { type Browser, chromium } from 'playwright';
import { effectiveUrl } from './baseUrl';
import { CONFIG_PATH, DB_PATH, LOG_DIR, SNAPSHOT_DIR } from './config';
import { migrate, openDb, toDrizzle } from './db';
import { DrizzleRunsRepo, type RunsRepo } from './repos/runsRepo';
import { DrizzleUrlRunsRepo, type UrlRunsRepo } from './repos/urlRunsRepo';
import { DrizzleUrlsRepo, type UrlsRepo } from './repos/urlsRepo';
import { scrape } from './scraper';
import type { Config, RunRecord, UrlRun } from './types';

type Logger = { error: (obj: unknown, msg: string) => void };
type ScrapeFn = typeof scrape;

export function findOpenRun(runsRepo: RunsRepo): RunRecord | undefined {
  return runsRepo.findOpenRun();
}

export function claimNextPending(urlRunsRepo: UrlRunsRepo, runId: string): UrlRun | undefined {
  return urlRunsRepo.claimNextPending(runId);
}

export function countPending(urlRunsRepo: UrlRunsRepo, runId: string): number {
  return urlRunsRepo.countPending(runId);
}

export function finalizeRun(
  runsRepo: RunsRepo,
  urlRunsRepo: UrlRunsRepo,
  runId: string,
  version: number,
  snapshotBaseDir: string,
): 0 | 1 {
  const failedRows = urlRunsRepo.listFailed(runId);

  if (failedRows.length > 0) {
    const versionDir = path.join(snapshotBaseDir, `version-${version}`);
    fs.mkdirSync(versionDir, { recursive: true });
    fs.writeFileSync(
      path.join(versionDir, 'errors.json'),
      JSON.stringify(
        failedRows.map((row) => ({ url: row.url, error: row.error })),
        null,
        2,
      ),
    );
  }

  urlRunsRepo.deleteByRun(runId);

  if (failedRows.length > 0) {
    runsRepo.markDoneWithErrors(runId);
    return 1;
  }

  runsRepo.markDone(runId);
  return 0;
}

export async function processUrlRun(
  urlsRepo: UrlsRepo,
  urlRunsRepo: UrlRunsRepo,
  browser: Browser,
  urlRun: UrlRun,
  version: number,
  snapshotBaseDir: string,
  config: Config,
  scrapeFn: ScrapeFn,
  logger: Logger,
  baseUrl?: string,
): Promise<void> {
  const urlRow = urlsRepo.findById(urlRun.url_id);
  if (!urlRow) {
    throw new Error(`url ${urlRun.url_id} not found`);
  }
  const snapshotDir = path.join(snapshotBaseDir, `version-${version}`, urlRow.page_slug);
  const fetchUrl = baseUrl !== undefined ? effectiveUrl(baseUrl, urlRow.url) : urlRow.url;

  try {
    await scrapeFn(browser, { url: fetchUrl, version, snapshotDir, config });
    urlRunsRepo.markDone(urlRun.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    urlRunsRepo.markFailed(urlRun.id, message);
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
  runsRepo: RunsRepo,
  urlsRepo: UrlsRepo,
  urlRunsRepo: UrlRunsRepo,
  browser: Browser,
  run: RunRecord,
  snapshotBaseDir: string,
  config: Config,
  deps: WorkerDeps = {},
  baseUrl?: string,
): Promise<0 | 1> {
  const scrapeFn = deps.scrapeFn ?? scrape;
  const sleepFn = deps.sleepFn ?? defaultSleep;
  const logger = deps.logger ?? { error: () => {} };

  for (;;) {
    const claimed = urlRunsRepo.claimNextPending(run.id);
    if (claimed) {
      await processUrlRun(
        urlsRepo,
        urlRunsRepo,
        browser,
        claimed,
        run.version,
        snapshotBaseDir,
        config,
        scrapeFn,
        logger,
        baseUrl,
      );
      continue;
    }

    if (urlRunsRepo.countPending(run.id) === 0) {
      break;
    }

    await sleepFn(500);
  }

  return finalizeRun(runsRepo, urlRunsRepo, run.id, run.version, snapshotBaseDir);
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
    const drizzleDb = toDrizzle(db);
    const runsRepo = new DrizzleRunsRepo(drizzleDb);
    const urlsRepo = new DrizzleUrlsRepo(drizzleDb);
    const urlRunsRepo = new DrizzleUrlRunsRepo(drizzleDb);

    const run = findOpenRun(runsRepo);
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
    const baseUrlArg = process.argv[2];

    try {
      process.exitCode = await runWorker(
        runsRepo,
        urlsRepo,
        urlRunsRepo,
        browser,
        run,
        SNAPSHOT_DIR,
        config,
        { logger },
        baseUrlArg,
      );
    } finally {
      await browser.close();
      db.close();
    }
  })();
}
