import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import BetterSqlite3 from 'better-sqlite3';
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
