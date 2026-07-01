import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type Database from 'better-sqlite3';
import { Command } from 'commander';
import { z } from 'zod';
import { DB_PATH } from './config';
import { migrate, openDb } from './db';

const urlSchema = z.url();

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

  for (const url of candidates) {
    if (urlExists(db, url)) {
      skipped++;
      continue;
    }
    insertUrl(db, url);
    added++;
  }

  return { added, skipped };
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  const program = new Command();

  program
    .command('add <url>')
    .description('register a URL to scrape')
    .action((url: string) => {
      const db = openDb(DB_PATH);
      try {
        migrate(db);
        console.log(addUrl(db, url) === 'added' ? 'ok' : 'already exists');
      } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
      } finally {
        db.close();
      }
    });

  program
    .command('load <file>')
    .description('register URLs from a file, one per line')
    .action((file: string) => {
      const db = openDb(DB_PATH);
      try {
        migrate(db);
        const { added, skipped } = loadUrls(db, file);
        console.log(`added ${added}, skipped ${skipped}`);
      } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
      } finally {
        db.close();
      }
    });

  program.parse();
}
