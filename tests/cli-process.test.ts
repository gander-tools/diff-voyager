import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

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
});
