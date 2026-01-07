/**
 * Diff Voyager Backend
 *
 * Main entry point for the backend API and crawler service.
 */

import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createApp } from './api/app.js';
import { createDatabase } from './storage/database.js';

const DEFAULT_PORT = 3000;
const DEFAULT_DATA_DIR = './data';

async function main() {
  const port = Number(process.env.PORT) || DEFAULT_PORT;
  const dataDir = process.env.DATA_DIR || DEFAULT_DATA_DIR;

  // Ensure data directories exist
  const dbPath = join(dataDir, 'diff-voyager.db');
  const artifactsDir = join(dataDir, 'artifacts');
  await mkdir(artifactsDir, { recursive: true });

  console.log('Diff Voyager Backend - Starting...');
  console.log(`Data directory: ${dataDir}`);

  // Initialize database
  const db = createDatabase({ dbPath, baseDir: dataDir, artifactsDir });
  console.log('Database initialized');

  // Create and start app
  const app = await createApp({ db, artifactsDir });

  await app.listen({ port, host: '0.0.0.0' });
  console.log(`API server running at http://localhost:${port}`);
  console.log(`API endpoints:`);
  console.log(`  POST /api/v1/scans - Create scan`);
  console.log(`  GET  /api/v1/projects/:id - Get project details`);
  console.log(`  GET  /health - Health check`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
