import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const tsxBin = path.join(repoRoot, 'node_modules/.bin/tsx');
const fixturePath = path.join(repoRoot, 'tests/fixtures/scrape-once.ts');

describe('scraper.ts regression: page.evaluate under tsx (V26)', () => {
  let tmpDir: string;
  let snapshotDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-scraper-proc-'));
    snapshotDir = path.join(tmpDir, 'version-1', 'some-slug');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('scrapes a real/local page without a page.evaluate ReferenceError', () => {
    const result = spawnSync(tsxBin, [fixturePath, snapshotDir], {
      cwd: repoRoot,
      encoding: 'utf-8',
    });

    expect(result.stderr).not.toContain('ReferenceError');
    expect(result.stderr).not.toContain('__name is not defined');
    expect(result.status).toBe(0);

    expect(fs.existsSync(path.join(snapshotDir, 'screenshot.png'))).toBe(true);

    const metaPath = path.join(snapshotDir, 'meta.json');
    expect(fs.existsSync(metaPath)).toBe(true);
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    expect(meta.title).toBe('Scrape Once');
  });
});
