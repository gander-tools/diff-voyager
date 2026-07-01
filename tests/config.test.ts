import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadEnvFiles } from '../src/config';

const VAR = 'VOYAGER_TEST_VAR';

describe('loadEnvFiles', () => {
  let tmpDir: string;

  afterEach(() => {
    delete process.env[VAR];
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('.env.local overrides .env for the same key', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-'));
    const envPath = path.join(tmpDir, '.env');
    const envLocalPath = path.join(tmpDir, '.env.local');
    fs.writeFileSync(envPath, `${VAR}=from_env\n`);
    fs.writeFileSync(envLocalPath, `${VAR}=from_local\n`);

    loadEnvFiles(envPath, envLocalPath);

    expect(process.env[VAR]).toBe('from_local');
  });

  it('.env value used when .env.local does not set that key', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-'));
    const envPath = path.join(tmpDir, '.env');
    const envLocalPath = path.join(tmpDir, '.env.local.missing');
    fs.writeFileSync(envPath, `${VAR}=from_env\n`);

    loadEnvFiles(envPath, envLocalPath);

    expect(process.env[VAR]).toBe('from_env');
  });

  it('both files missing → does not throw, process.env untouched', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-'));
    const envPath = path.join(tmpDir, `.env.${randomUUID()}`);
    const envLocalPath = path.join(tmpDir, `.env.local.${randomUUID()}`);

    expect(() => loadEnvFiles(envPath, envLocalPath)).not.toThrow();
    expect(process.env[VAR]).toBeUndefined();
  });
});
