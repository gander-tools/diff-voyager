/**
 * Diff Voyager Backend
 *
 * Main entry point for the backend API and crawler service.
 */

import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createApp } from './api/app.js';
import { createDatabase } from './storage/database.js';
import { createDrizzleDb } from './storage/drizzle/db.js';

const DEFAULT_PORT = 3000;
const DEFAULT_DATA_DIR = './data';

async function main() {
  const port = Number(process.env.PORT) || DEFAULT_PORT;
  const dataDir = process.env.DATA_DIR || DEFAULT_DATA_DIR;

  // Ensure data directories exist with restricted permissions
  const dbPath = join(dataDir, 'diff-voyager.db');
  const artifactsDir = join(dataDir, 'artifacts');
  // Create directory with restricted permissions (owner only: rwx------)
  await mkdir(artifactsDir, { recursive: true, mode: 0o700 });

  console.log('Diff Voyager Backend - Starting...');
  console.log(`Data directory: ${dataDir}`);

  // Initialize database
  const db = createDatabase({ dbPath, baseDir: dataDir, artifactsDir });
  console.log('Database initialized');

  // Create Drizzle DB instance for type-safe queries
  const drizzleDb = createDrizzleDb(db);
  console.log('Drizzle ORM initialized');

  // Create and start app
  const app = await createApp({ db, drizzleDb, artifactsDir });

  await app.listen({ port, host: '0.0.0.0' });
  app.log.info(`API server running at http://localhost:${port}`);
  app.log.info('API endpoints:');
  app.log.info('  POST /api/v1/scans - Create scan');
  app.log.info('  GET  /api/v1/projects/:id - Get project details');
  app.log.info('  GET  /health - Health check');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
