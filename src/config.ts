import path from 'node:path';
import dotenv from 'dotenv';

export function loadEnvFiles(envPath: string, envLocalPath: string): void {
  dotenv.config({ path: envPath, quiet: true });
  dotenv.config({ path: envLocalPath, override: true, quiet: true });
}

loadEnvFiles(path.resolve('.env'), path.resolve('.env.local'));

export const DB_PATH = process.env.DB_PATH ?? path.resolve('data/voyager.db');
export const SNAPSHOT_DIR = process.env.SNAPSHOT_DIR ?? path.resolve('snapshots');
export const CONFIG_PATH = process.env.CONFIG_PATH ?? path.resolve('config.json');
export const LOG_DIR = process.env.LOG_DIR ?? path.resolve('logs');
export const RESULT_DIR = process.env.RESULT_DIR ?? path.resolve('results');
