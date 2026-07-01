import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type Database from 'better-sqlite3';
import { Command } from 'commander';
import { z } from 'zod';
import { DB_PATH } from './config';
import { migrate, openDb } from './db';

const urlSchema = z.url();

interface OpenRun {
  id: string;
  version: number;
  pid: number | null;
}

function findOpenRun(db: Database.Database): OpenRun | undefined {
  return db.prepare("SELECT id, version, pid FROM runs WHERE status = 'open'").get() as
    | OpenRun
    | undefined;
}

function insertUrl(db: Database.Database, url: string): void {
  const path = new URL(url).pathname;
  db.prepare('INSERT INTO urls (id, url, path) VALUES (?, ?, ?)').run(randomUUID(), url, path);
}

function urlExists(db: Database.Database, url: string): boolean {
  return db.prepare('SELECT id FROM urls WHERE url = ?').get(url) !== undefined;
}

export function addUrl(db: Database.Database, url: string): 'added' | 'exists' {
  if (!urlSchema.safeParse(url).success) {
    throw new Error(`Invalid URL: ${url}`);
  }

  if (urlExists(db, url)) {
    return 'exists';
  }

  insertUrl(db, url);
  return 'added';
}

export function loadUrls(
  db: Database.Database,
  filePath: string,
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

  const insertAll = db.transaction(() => {
    for (const url of candidates) {
      if (urlExists(db, url)) {
        skipped++;
        continue;
      }
      insertUrl(db, url);
      added++;
    }
  });

  insertAll();

  return { added, skipped };
}

type SpawnWorker = () => { pid: number };

function defaultSpawnWorker(): { pid: number } {
  const tsxBin = fileURLToPath(new URL('../node_modules/.bin/tsx', import.meta.url));
  const workerPath = fileURLToPath(new URL('./worker.ts', import.meta.url));
  const child = spawn(tsxBin, [workerPath], { detached: true, stdio: 'ignore' });
  child.unref();

  if (!child.pid) {
    throw new Error('failed to spawn worker');
  }

  return { pid: child.pid };
}

export function insertRunAndUrlRuns(db: Database.Database, version: number): string {
  const runId = randomUUID();

  const insert = db.transaction(() => {
    db.prepare('INSERT INTO runs (id, version) VALUES (?, ?)').run(runId, version);

    const urls = db.prepare('SELECT id FROM urls').all() as { id: string }[];
    for (const { id: urlId } of urls) {
      db.prepare('INSERT INTO url_runs (id, url_id, run_id) VALUES (?, ?, ?)').run(
        randomUUID(),
        urlId,
        runId,
      );
    }
  });

  insert();

  return runId;
}

export function runStart(
  db: Database.Database,
  spawnWorker: SpawnWorker = defaultSpawnWorker,
): { version: number; pid: number } {
  const urlCount = (db.prepare('SELECT COUNT(*) AS c FROM urls').get() as { c: number }).c;
  if (urlCount === 0) {
    throw new Error('no URLs registered');
  }

  const open = findOpenRun(db);
  if (open) {
    throw new Error(`run ${open.version} is still open`);
  }

  const version =
    (db.prepare('SELECT COALESCE(MAX(version),0) AS v FROM runs').get() as { v: number }).v + 1;
  const runId = insertRunAndUrlRuns(db, version);

  try {
    const { pid } = spawnWorker();
    db.prepare('UPDATE runs SET pid = ? WHERE id = ?').run(pid, runId);
    return { version, pid };
  } catch (error) {
    db.prepare('DELETE FROM url_runs WHERE run_id = ?').run(runId);
    db.prepare('DELETE FROM runs WHERE id = ?').run(runId);
    throw error;
  }
}

export function abandonRun(db: Database.Database, runId: string): void {
  const abandon = db.transaction(() => {
    db.prepare('DELETE FROM url_runs WHERE run_id = ?').run(runId);
    db.prepare("UPDATE runs SET status = 'abandoned' WHERE id = ? AND status = 'open'").run(runId);
  });

  abandon();
}

export function runStop(
  db: Database.Database,
  kill: (pid: number) => void = (pid) => process.kill(pid, 'SIGTERM'),
): void {
  const open = findOpenRun(db);
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

  abandonRun(db, open.id);
}

export function runReset(db: Database.Database): void {
  const open = findOpenRun(db);
  if (!open) {
    throw new Error('no open run');
  }

  abandonRun(db, open.id);
}

export function urlList(db: Database.Database): { url: string; createdAt: number }[] {
  return db.prepare('SELECT url, created_at AS createdAt FROM urls ORDER BY created_at').all() as {
    url: string;
    createdAt: number;
  }[];
}

export function urlRemove(db: Database.Database, url: string): 'removed' | 'not-found' {
  const open = findOpenRun(db);
  if (open) {
    throw new Error(`run ${open.version} is still open`);
  }

  const result = db.prepare('DELETE FROM urls WHERE url = ?').run(url);
  return result.changes > 0 ? 'removed' : 'not-found';
}

export function urlClear(db: Database.Database): number {
  const open = findOpenRun(db);
  if (open) {
    throw new Error(`run ${open.version} is still open`);
  }

  return db.prepare('DELETE FROM urls').run().changes;
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

function runCommand<T>(fn: (db: Database.Database) => T): T | undefined {
  const db = openDb(DB_PATH);
  try {
    migrate(db);
    return fn(db);
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
      runCommand((db) => {
        console.log(addUrl(db, url) === 'added' ? 'ok' : 'already exists');
      });
    });

  program
    .command('load <file>')
    .description('register URLs from a file, one per line')
    .action((file: string) => {
      runCommand((db) => {
        const { added, skipped } = loadUrls(db, file);
        console.log(`added ${added}, skipped ${skipped}`);
      });
    });

  const run = program.command('run');

  run
    .command('start')
    .description('create a new run and spawn the worker')
    .action(() => {
      runCommand((db) => {
        const { version, pid } = runStart(db);
        console.log(`run ${version} started, PID: ${pid}`);
      });
    });

  run
    .command('stop')
    .description('stop the open run')
    .action(() => {
      runCommand((db) => {
        runStop(db);
        console.log('stopped');
      });
    });

  run
    .command('reset')
    .description('abandon the open run without signalling the worker')
    .action(() => {
      runCommand((db) => {
        runReset(db);
        console.log('reset ok');
      });
    });

  const url = program.command('url');

  url
    .command('list')
    .description('list registered urls')
    .action(() => {
      runCommand((db) => {
        const rows = urlList(db);
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
      runCommand((db) => {
        console.log(urlRemove(db, urlArg) === 'removed' ? 'removed' : 'not found');
      });
    });

  url
    .command('clear')
    .description('remove all registered urls')
    .action(() => {
      runCommand((db) => {
        const n = urlClear(db);
        console.log(`cleared ${n} urls`);
      });
    });

  if (process.argv.length <= 2) {
    program.outputHelp();
    process.exit(0);
  }

  program.parse();
}
