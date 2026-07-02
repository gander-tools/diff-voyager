import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { z } from 'zod';
import { parseBaseUrl } from './baseUrl';
import { DB_PATH, LOG_DIR, SNAPSHOT_DIR } from './config';
import { migrate, openDb, toDrizzle } from './db';
import { DrizzleRunsRepo, type RunsRepo } from './repos/runsRepo';
import { DrizzleUrlRunsRepo, type UrlRunsRepo } from './repos/urlRunsRepo';
import { DrizzleUrlsRepo, type UrlsRepo } from './repos/urlsRepo';
import type { RunRecord } from './types';

const urlSchema = z.url();

export function findOpenRun(runsRepo: RunsRepo): RunRecord | undefined {
  return runsRepo.findOpenRun();
}

export function addUrl(urlsRepo: UrlsRepo, url: string): 'added' | 'exists' {
  if (!urlSchema.safeParse(url).success) {
    throw new Error(`Invalid URL: ${url}`);
  }

  return urlsRepo.insert(url);
}

export function loadUrls(
  urlsRepo: UrlsRepo,
  filePath: string,
  drizzleDb: BetterSQLite3Database,
): { added: number; skipped: number } {
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  const candidates = lines
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  const invalid = candidates.filter((line) => !urlSchema.safeParse(line).success);
  if (invalid.length > 0) {
    throw new Error(`Invalid URL(s):\n${invalid.join('\n')}`);
  }

  let added = 0;
  let skipped = 0;

  drizzleDb.transaction(() => {
    for (const url of candidates) {
      if (urlsRepo.insert(url) === 'added') {
        added++;
      } else {
        skipped++;
      }
    }
  });

  return { added, skipped };
}

type SpawnWorker = (baseUrl?: string) => { pid: number };

function defaultSpawnWorker(baseUrl?: string): { pid: number } {
  const tsxBin = fileURLToPath(new URL('../node_modules/.bin/tsx', import.meta.url));
  const workerPath = fileURLToPath(new URL('./worker.ts', import.meta.url));
  const args = baseUrl !== undefined ? [workerPath, baseUrl] : [workerPath];
  const child = spawn(tsxBin, args, { detached: true, stdio: 'ignore' });
  child.unref();

  if (!child.pid) {
    throw new Error('failed to spawn worker');
  }

  return { pid: child.pid };
}

export function runStart(
  runsRepo: RunsRepo,
  urlsRepo: UrlsRepo,
  urlRunsRepo: UrlRunsRepo,
  spawnWorker: SpawnWorker = defaultSpawnWorker,
  baseUrl?: string,
): { version: number; pid: number } {
  if (urlsRepo.count() === 0) {
    throw new Error('no URLs registered');
  }

  const open = runsRepo.findOpenRun();
  if (open) {
    throw new Error(`run ${open.version} is still open`);
  }

  const bySlug = new Map<string, string[]>();
  for (const u of urlsRepo.list()) {
    bySlug.set(u.page_slug, [...(bySlug.get(u.page_slug) ?? []), u.url]);
  }
  for (const [slug, urls] of bySlug) {
    if (urls.length >= 2) {
      throw new Error(`duplicate page_slug: ${slug} (urls: ${urls.join(', ')})`);
    }
  }

  const origin = baseUrl !== undefined ? parseBaseUrl(baseUrl) : undefined;

  const { id: runId, version } = runsRepo.insertRunWithUrlRuns();

  try {
    const { pid } = spawnWorker(origin);
    runsRepo.updatePid(runId, pid);
    return { version, pid };
  } catch (error) {
    urlRunsRepo.deleteByRun(runId);
    runsRepo.deleteRun(runId);
    throw error;
  }
}

export function abandonRun(runsRepo: RunsRepo, urlRunsRepo: UrlRunsRepo, runId: string): void {
  urlRunsRepo.deleteByRun(runId);
  runsRepo.markAbandoned(runId);
}

export function runStop(
  runsRepo: RunsRepo,
  urlRunsRepo: UrlRunsRepo,
  kill: (pid: number) => void = (pid) => process.kill(pid, 'SIGTERM'),
): void {
  const open = runsRepo.findOpenRun();
  if (!open) {
    throw new Error('no open run');
  }

  try {
    kill(open.pid as number);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ESRCH') {
      throw new Error('process not found, use run reset');
    }
    throw error;
  }

  abandonRun(runsRepo, urlRunsRepo, open.id);
}

export function runReset(runsRepo: RunsRepo, urlRunsRepo: UrlRunsRepo): void {
  const open = runsRepo.findOpenRun();
  if (!open) {
    throw new Error('no open run');
  }

  abandonRun(runsRepo, urlRunsRepo, open.id);
}

export function urlList(urlsRepo: UrlsRepo): { url: string; createdAt: number }[] {
  return urlsRepo
    .list()
    .sort((a, b) => a.created_at - b.created_at)
    .map((row) => ({ url: row.url, createdAt: row.created_at }));
}

export function urlRemove(
  runsRepo: RunsRepo,
  urlsRepo: UrlsRepo,
  url: string,
): 'removed' | 'not-found' {
  const open = runsRepo.findOpenRun();
  if (open) {
    throw new Error(`run ${open.version} is still open`);
  }

  return urlsRepo.remove(url);
}

export function urlClear(runsRepo: RunsRepo, urlsRepo: UrlsRepo): number {
  const open = runsRepo.findOpenRun();
  if (open) {
    throw new Error(`run ${open.version} is still open`);
  }

  return urlsRepo.clear();
}

export function cleanProject(
  runsRepo: RunsRepo,
  paths: { dbDir: string; snapshotDir: string; logDir: string },
): string[] {
  const open = runsRepo.findOpenRun();
  if (open) {
    throw new Error(`run ${open.version} is still open`);
  }

  const removed = [paths.dbDir, paths.snapshotDir, paths.logDir];
  for (const dir of removed) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  return removed;
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

interface Repos {
  runsRepo: RunsRepo;
  urlsRepo: UrlsRepo;
  urlRunsRepo: UrlRunsRepo;
  drizzleDb: BetterSQLite3Database;
}

function runCommand<T>(fn: (repos: Repos) => T): T | undefined {
  const db = openDb(DB_PATH);
  try {
    migrate(db);
    const drizzleDb = toDrizzle(db);
    const repos: Repos = {
      runsRepo: new DrizzleRunsRepo(drizzleDb),
      urlsRepo: new DrizzleUrlsRepo(drizzleDb),
      urlRunsRepo: new DrizzleUrlRunsRepo(drizzleDb),
      drizzleDb,
    };
    return fn(repos);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return undefined;
  } finally {
    db.close();
  }
}

if (isMainModule) {
  const program = new Command();

  program
    .command('add <url>')
    .description('register a URL to scrape')
    .action((url: string) => {
      runCommand(({ urlsRepo }) => {
        console.log(addUrl(urlsRepo, url) === 'added' ? 'ok' : 'already exists');
      });
    });

  program
    .command('load <file>')
    .description('register URLs from a file, one per line')
    .action((file: string) => {
      runCommand(({ urlsRepo, drizzleDb }) => {
        const { added, skipped } = loadUrls(urlsRepo, file, drizzleDb);
        console.log(`added ${added}, skipped ${skipped}`);
      });
    });

  const run = program.command('run');

  run
    .command('start [base-url]')
    .description('create a new run and spawn the worker')
    .action((baseUrl?: string) => {
      runCommand(({ runsRepo, urlsRepo, urlRunsRepo }) => {
        const { version, pid } = runStart(
          runsRepo,
          urlsRepo,
          urlRunsRepo,
          defaultSpawnWorker,
          baseUrl,
        );
        console.log(`run ${version} started, PID: ${pid}`);
      });
    });

  run
    .command('stop')
    .description('stop the open run')
    .action(() => {
      runCommand(({ runsRepo, urlRunsRepo }) => {
        runStop(runsRepo, urlRunsRepo);
        console.log('stopped');
      });
    });

  run
    .command('reset')
    .description('abandon the open run without signalling the worker')
    .action(() => {
      runCommand(({ runsRepo, urlRunsRepo }) => {
        runReset(runsRepo, urlRunsRepo);
        console.log('reset ok');
      });
    });

  const url = program.command('url');

  url
    .command('list')
    .description('list registered urls')
    .action(() => {
      runCommand(({ urlsRepo }) => {
        const rows = urlList(urlsRepo);
        const urlWidth = Math.max(3, ...rows.map((row) => row.url.length));
        for (const row of rows) {
          console.log(
            `${row.url.padEnd(urlWidth)}  ${new Date(row.createdAt * 1000).toISOString()}`,
          );
        }
      });
    });

  url
    .command('remove <url>')
    .description('remove a registered url')
    .action((urlArg: string) => {
      runCommand(({ runsRepo, urlsRepo }) => {
        console.log(urlRemove(runsRepo, urlsRepo, urlArg) === 'removed' ? 'removed' : 'not found');
      });
    });

  url
    .command('clear')
    .description('remove all registered urls')
    .action(() => {
      runCommand(({ runsRepo, urlsRepo }) => {
        const n = urlClear(runsRepo, urlsRepo);
        console.log(`cleared ${n} urls`);
      });
    });

  program
    .command('clean')
    .description('delete DB, snapshots, and logs, resetting to a fresh install')
    .action(() => {
      runCommand(({ runsRepo }) => {
        const removed = cleanProject(runsRepo, {
          dbDir: path.dirname(DB_PATH),
          snapshotDir: SNAPSHOT_DIR,
          logDir: LOG_DIR,
        });
        console.log(`cleaned: ${removed.join(', ')}`);
      });
    });

  if (process.argv.length <= 2) {
    program.outputHelp();
    process.exit(0);
  }

  program.parse();
}
