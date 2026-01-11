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

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed: Record<string, string | undefined> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = args[i + 1];
      if (value && !value.startsWith('--')) {
        parsed[key] = value;
        i++; // Skip next arg as it's the value
      }
    }
  }

  return parsed;
}

async function main() {
  const args = parseArgs();

  const port = Number(args.port || process.env.PORT) || DEFAULT_PORT;
  const dataDir = args['data-dir'] || process.env.DATA_DIR || DEFAULT_DATA_DIR;

  // Parse log levels with priority: CLI args > env vars > defaults
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const defaultLogLevel = isDevelopment ? 'debug' : 'info';

  const logLevel = args['log-level'] || process.env.LOG_LEVEL || defaultLogLevel;
  const logLevelConsole = args['log-level-console'] || process.env.LOG_LEVEL_CONSOLE || logLevel;
  const logLevelFile = args['log-level-file'] || process.env.LOG_LEVEL_FILE || 'debug';

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
  const app = await createApp({
    db,
    drizzleDb,
    artifactsDir,
    logLevelConsole,
    logLevelFile,
  });

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
