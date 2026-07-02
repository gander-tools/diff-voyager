import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import BetterSqlite3 from 'better-sqlite3';
import { PNG } from 'pngjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { migrate, openDb } from '../src/db';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const tsxBin = path.join(repoRoot, 'node_modules/.bin/tsx');
const cliPath = path.join(repoRoot, 'src/cli.ts');

function runCli(args: string[], dbPath: string) {
  return spawnSync(tsxBin, [cliPath, ...args], {
    cwd: repoRoot,
    env: { ...process.env, DB_PATH: dbPath },
    encoding: 'utf-8',
  });
}

function lastLine(output: string): string {
  const lines = output.trim().split('\n');
  return lines[lines.length - 1] ?? '';
}

function seedOpenRun(dbPath: string, pid: number): void {
  const db = openDb(dbPath);
  migrate(db);
  db.prepare("INSERT INTO runs (id, version, status, pid) VALUES (?, 1, 'open', ?)").run(
    randomUUID(),
    pid,
  );
  db.close();
}

function runStatus(dbPath: string): string {
  const db = new BetterSqlite3(dbPath);
  const row = db.prepare('SELECT status FROM runs LIMIT 1').get() as { status: string };
  db.close();
  return row.status;
}

// V22: spawnSync blocks until the child has exited, so its pid is free at return time —
// avoids a hardcoded magic PID that may fall outside a host's kernel pid_max.
function freePid(): number {
  const result = spawnSync(process.execPath, ['-e', '0']);
  if (!result.pid) {
    throw new Error('failed to obtain a free pid');
  }
  return result.pid;
}

describe('cli isMainModule wiring (subprocess characterization, V19)', () => {
  let tmpDir: string;
  let dbPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-cli-proc-'));
    dbPath = path.join(tmpDir, 'test.db');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it(
    '`add <url>` prints "ok" and exits 0 for a new url',
    () => {
      const result = runCli(['add', 'https://example.com/a'], dbPath);

      expect(lastLine(result.stdout)).toBe('ok');
      expect(result.status).toBe(0);
    },
    10000,
  );

  it(
    '`add <url>` prints "already exists" and exits 0 for a duplicate url',
    () => {
      runCli(['add', 'https://example.com/a'], dbPath);
      const result = runCli(['add', 'https://example.com/a'], dbPath);

      expect(lastLine(result.stdout)).toBe('already exists');
      expect(result.status).toBe(0);
    },
    10000,
  );

  it(
    '`add <url>` prints error to stderr and exits 1 for an invalid url',
    () => {
      const result = runCli(['add', 'not-a-url'], dbPath);

      expect(result.stderr).toContain('Invalid URL');
      expect(result.status).toBe(1);
    },
    10000,
  );

  it(
    '`run start` prints "no URLs registered" to stderr and exits 1 when urls table is empty',
    () => {
      const result = runCli(['run', 'start'], dbPath);

      expect(result.stderr).toContain('no URLs registered');
      expect(result.status).toBe(1);
    },
    10000,
  );

  it(
    'invoked with 0 args prints help/usage text and exits 0',
    () => {
      const result = runCli([], dbPath);

      expect(result.stdout).toContain('Usage:');
      expect(result.status).toBe(0);
    },
    10000,
  );

  it(
    'invoked with an unknown command still exits 1 (unaffected by 0-arg help path)',
    () => {
      const result = runCli(['foobar'], dbPath);

      expect(result.status).toBe(1);
    },
    10000,
  );
});

describe('cli `load <file>` (subprocess, T25)', () => {
  let tmpDir: string;
  let dbPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-cli-proc-'));
    dbPath = path.join(tmpDir, 'test.db');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it(
    'prints "added N, skipped M" and exits 0 for a file of valid urls (blank/# lines ignored)',
    () => {
      const file = path.join(tmpDir, 'urls.txt');
      fs.writeFileSync(
        file,
        ['https://example.com/a', '', '# a comment', 'https://example.com/b'].join('\n'),
      );

      const result = runCli(['load', file], dbPath);

      expect(lastLine(result.stdout)).toBe('added 2, skipped 0');
      expect(result.status).toBe(0);
    },
    10000,
  );
});

describe('cli `run stop` (subprocess, T25)', () => {
  let tmpDir: string;
  let dbPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-cli-proc-'));
    dbPath = path.join(tmpDir, 'test.db');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it(
    'SIGTERMs the live pid, prints "stopped", exits 0, and abandons the run (V9/V16)',
    () => {
      const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
      seedOpenRun(dbPath, child.pid as number);

      const result = runCli(['run', 'stop'], dbPath);

      expect(lastLine(result.stdout)).toBe('stopped');
      expect(result.status).toBe(0);
      expect(runStatus(dbPath)).toBe('abandoned');
    },
    10000,
  );

  it(
    'prints "no open run" to stderr and exits 1 when there is no open run',
    () => {
      const result = runCli(['run', 'stop'], dbPath);

      expect(result.stderr).toContain('no open run');
      expect(result.status).toBe(1);
    },
    10000,
  );

  it(
    'prints "process not found, use run reset" and exits 1 for an already-dead pid (V22), leaving the run open',
    () => {
      seedOpenRun(dbPath, freePid());

      const result = runCli(['run', 'stop'], dbPath);

      expect(result.stderr).toContain('process not found, use run reset');
      expect(result.status).toBe(1);
      expect(runStatus(dbPath)).toBe('open');
    },
    10000,
  );
});

describe('cli `run reset` (subprocess, T25)', () => {
  let tmpDir: string;
  let dbPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-cli-proc-'));
    dbPath = path.join(tmpDir, 'test.db');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it(
    'prints "reset ok", exits 0, and abandons the run without signalling (V9)',
    () => {
      seedOpenRun(dbPath, 4242);

      const result = runCli(['run', 'reset'], dbPath);

      expect(lastLine(result.stdout)).toBe('reset ok');
      expect(result.status).toBe(0);
      expect(runStatus(dbPath)).toBe('abandoned');
    },
    10000,
  );

  it(
    'prints "no open run" to stderr and exits 1 when there is no open run',
    () => {
      const result = runCli(['run', 'reset'], dbPath);

      expect(result.stderr).toContain('no open run');
      expect(result.status).toBe(1);
    },
    10000,
  );
});

describe('cli `url list` (subprocess, T25)', () => {
  let tmpDir: string;
  let dbPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-cli-proc-'));
    dbPath = path.join(tmpDir, 'test.db');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it(
    'prints all registered urls and exits 0',
    () => {
      runCli(['add', 'https://example.com/a'], dbPath);
      runCli(['add', 'https://example.com/b'], dbPath);

      const result = runCli(['url', 'list'], dbPath);

      expect(result.stdout).toContain('https://example.com/a');
      expect(result.stdout).toContain('https://example.com/b');
      expect(result.status).toBe(0);
    },
    10000,
  );
});

describe('cli `url remove <url>` (subprocess, T25)', () => {
  let tmpDir: string;
  let dbPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-cli-proc-'));
    dbPath = path.join(tmpDir, 'test.db');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it(
    'prints "removed" and exits 0 for a registered url',
    () => {
      runCli(['add', 'https://example.com/a'], dbPath);

      const result = runCli(['url', 'remove', 'https://example.com/a'], dbPath);

      expect(lastLine(result.stdout)).toBe('removed');
      expect(result.status).toBe(0);
    },
    10000,
  );

  it(
    'prints "not found" and exits 0 for an unregistered url',
    () => {
      const result = runCli(['url', 'remove', 'https://example.com/a'], dbPath);

      expect(lastLine(result.stdout)).toBe('not found');
      expect(result.status).toBe(0);
    },
    10000,
  );

  it(
    'prints "is still open" to stderr and exits 1 when a run is open',
    () => {
      runCli(['add', 'https://example.com/a'], dbPath);
      seedOpenRun(dbPath, 4242);

      const result = runCli(['url', 'remove', 'https://example.com/a'], dbPath);

      expect(result.stderr).toContain('is still open');
      expect(result.status).toBe(1);
    },
    10000,
  );
});

describe('cli `clean` (subprocess, T34)', () => {
  let tmpDir: string;
  let dbPath: string;
  let snapshotDir: string;
  let logDir: string;

  function runClean(env: Record<string, string>) {
    return spawnSync(tsxBin, [cliPath, 'clean'], {
      cwd: repoRoot,
      env: { ...process.env, ...env },
      encoding: 'utf-8',
    });
  }

  function seedSnapshotAndLogs(): void {
    fs.mkdirSync(snapshotDir, { recursive: true });
    fs.writeFileSync(path.join(snapshotDir, 'placeholder.txt'), 'snapshot');
    fs.mkdirSync(logDir, { recursive: true });
    fs.writeFileSync(path.join(logDir, 'worker-v1.log'), 'log');
  }

  function seedDb(): void {
    const db = openDb(dbPath);
    migrate(db);
    db.close();
  }

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-cli-proc-'));
    dbPath = path.join(tmpDir, 'data', 'test.db');
    snapshotDir = path.join(tmpDir, 'snapshots');
    logDir = path.join(tmpDir, 'logs');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it(
    'prints "is still open" to stderr and exits 1 when a run is open, leaving artifacts intact (V25)',
    () => {
      seedOpenRun(dbPath, 4242);
      seedSnapshotAndLogs();

      const result = runClean({ DB_PATH: dbPath, SNAPSHOT_DIR: snapshotDir, LOG_DIR: logDir });

      expect(result.stderr).toContain('is still open');
      expect(result.status).toBe(1);
      expect(fs.existsSync(path.dirname(dbPath))).toBe(true);
      expect(fs.existsSync(snapshotDir)).toBe(true);
      expect(fs.existsSync(logDir)).toBe(true);
    },
    10000,
  );

  it(
    'deletes the DB_PATH dir, SNAPSHOT_DIR and LOG_DIR and prints "cleaned:" when no run is open (V25)',
    () => {
      seedDb();
      seedSnapshotAndLogs();

      const result = runClean({ DB_PATH: dbPath, SNAPSHOT_DIR: snapshotDir, LOG_DIR: logDir });

      expect(result.stdout).toContain('cleaned:');
      expect(result.status).toBe(0);
      expect(fs.existsSync(path.dirname(dbPath))).toBe(false);
      expect(fs.existsSync(snapshotDir)).toBe(false);
      expect(fs.existsSync(logDir)).toBe(false);
    },
    10000,
  );

  it(
    'a subsequent CLI invocation recreates the DB_PATH dir without throwing (V21/V25)',
    () => {
      seedDb();
      seedSnapshotAndLogs();
      runClean({ DB_PATH: dbPath, SNAPSHOT_DIR: snapshotDir, LOG_DIR: logDir });

      const result = runCli(['url', 'list'], dbPath);

      expect(result.status).toBe(0);
      expect(fs.existsSync(path.dirname(dbPath))).toBe(true);
    },
    10000,
  );
});

describe('cli `url clear` (subprocess, T25)', () => {
  let tmpDir: string;
  let dbPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-cli-proc-'));
    dbPath = path.join(tmpDir, 'test.db');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it(
    'prints "cleared N urls" and exits 0',
    () => {
      runCli(['add', 'https://example.com/a'], dbPath);
      runCli(['add', 'https://example.com/b'], dbPath);

      const result = runCli(['url', 'clear'], dbPath);

      expect(lastLine(result.stdout)).toBe('cleared 2 urls');
      expect(result.status).toBe(0);
    },
    10000,
  );

  it(
    'prints "is still open" to stderr and exits 1 when a run is open',
    () => {
      seedOpenRun(dbPath, 4242);

      const result = runCli(['url', 'clear'], dbPath);

      expect(result.stderr).toContain('is still open');
      expect(result.status).toBe(1);
    },
    10000,
  );
});

describe('cli `diff <v1> <v2> [url-or-path]` (subprocess, T65/T66)', () => {
  let tmpDir: string;
  let dbPath: string;
  let snapshotDir: string;
  let resultDir: string;

  function runDiff(args: string[], env: Record<string, string> = {}) {
    return spawnSync(tsxBin, [cliPath, 'diff', ...args], {
      cwd: repoRoot,
      env: {
        ...process.env,
        DB_PATH: dbPath,
        SNAPSHOT_DIR: snapshotDir,
        RESULT_DIR: resultDir,
        ...env,
      },
      encoding: 'utf-8',
    });
  }

  function writeSnapshot(version: number, slug: string): void {
    const dir = path.join(snapshotDir, `version-${version}`, slug);
    fs.mkdirSync(dir, { recursive: true });
    const png = new PNG({ width: 2, height: 2 });
    fs.writeFileSync(path.join(dir, 'screenshot.png'), PNG.sync.write(png));
    fs.writeFileSync(
      path.join(dir, 'meta.json'),
      JSON.stringify({
        url: 'https://example.com/a',
        version,
        scraped_at: new Date().toISOString(),
        title: 'Title',
        lang: 'en',
        canonical: '',
        description: '',
        og_description: '',
        links: [],
        js_errors: [],
      }),
    );
  }

  function seedDb(): void {
    const db = openDb(dbPath);
    migrate(db);
    db.close();
  }

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-cli-proc-'));
    dbPath = path.join(tmpDir, 'test.db');
    snapshotDir = path.join(tmpDir, 'snapshots');
    resultDir = path.join(tmpDir, 'results');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it(
    'diffs matching page_slugs and exits 0 (happy path)',
    () => {
      seedDb();
      writeSnapshot(1, 'slug-a');
      writeSnapshot(2, 'slug-a');

      const result = runDiff(['1', '2']);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('slug-a');
      expect(fs.existsSync(path.join(resultDir, 'diff-v1-v2', 'slug-a', 'meta.json'))).toBe(true);
    },
    10000,
  );

  it(
    'prints "still open" to stderr and exits 1 when the run for v1 or v2 is open (V43)',
    () => {
      seedDb();
      writeSnapshot(1, 'slug-a');
      writeSnapshot(2, 'slug-a');
      seedOpenRun(dbPath, freePid());
      const db = new BetterSqlite3(dbPath);
      db.prepare("UPDATE runs SET version = 1 WHERE status = 'open'").run();
      db.close();

      const result = runDiff(['1', '2']);

      expect(result.stderr).toContain('still open');
      expect(result.status).toBe(1);
    },
    10000,
  );
});

describe('cli `config init` (subprocess, T77)', () => {
  let tmpDir: string;
  let dbPath: string;
  let configPath: string;

  function runConfigInit() {
    return spawnSync(tsxBin, [cliPath, 'config', 'init'], {
      cwd: repoRoot,
      env: { ...process.env, DB_PATH: dbPath, CONFIG_PATH: configPath },
      encoding: 'utf-8',
    });
  }

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-cli-proc-'));
    dbPath = path.join(tmpDir, 'data', 'test.db');
    configPath = path.join(tmpDir, 'config.json');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it(
    'writes a config.json matching the schema and exits 0 when CONFIG_PATH is absent (V51)',
    () => {
      const result = runConfigInit();

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('config.json written');
      expect(fs.existsSync(configPath)).toBe(true);

      const written = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      expect(written.screenshot.rules.hide['*']).toEqual([
        '.ad',
        '.ads',
        '.cookie-banner',
        '.cookie-consent',
      ]);
      expect(written.screenshot.full_page).toBe(true);
      expect(written.screenshot.format).toBe('png');
      expect(written.timeout_ms).toBe(30000);
      expect(written.wait_for).toBe('load');
      expect(written.viewport).toEqual({ width: 1280, height: 800 });
      expect(written.headless).toBe(true);
    },
    10000,
  );

  it(
    'errors "config.json already exists", leaves the file untouched, and exits 1 when CONFIG_PATH exists (V51)',
    () => {
      fs.writeFileSync(configPath, '{"custom":true}');

      const result = runConfigInit();

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('config.json already exists');
      expect(fs.readFileSync(configPath, 'utf-8')).toBe('{"custom":true}');
    },
    10000,
  );
});
