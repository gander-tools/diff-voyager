/**
 * Fastify application setup
 */

import Fastify, { type FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { API_BASE_PATH } from '@gander-tools/diff-voyager-shared';
import type { DatabaseInstance } from '../storage/database.js';
import { registerScanRoutes } from './routes/scans.js';
import { registerProjectRoutes } from './routes/projects.js';
import { registerArtifactRoutes } from './routes/artifacts.js';

export interface AppConfig {
  db: DatabaseInstance;
  artifactsDir: string;
}

export async function createApp(config: AppConfig): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
  });

  // Register rate limiting plugin
  await app.register(rateLimit, {
    global: false, // We'll apply it selectively to specific routes
    max: 100,
    timeWindow: '1 minute',
  });

  // Error handler
  app.setErrorHandler((error: Error & { statusCode?: number; validation?: unknown }, _request, reply) => {
    const statusCode = error.statusCode || 500;
    reply.status(statusCode).send({
      error: {
        code: statusCode === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
        message: error.message,
        details: error.validation || undefined,
      },
    });
  });

  // Not found handler
  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
      },
    });
  });

  // Health check
  app.get('/health', async () => {
    return { status: 'ok' };
  });

  // Register routes
  await app.register(registerScanRoutes, { prefix: API_BASE_PATH, db: config.db, artifactsDir: config.artifactsDir });
  await app.register(registerProjectRoutes, { prefix: API_BASE_PATH, db: config.db });
  await app.register(registerArtifactRoutes, { prefix: API_BASE_PATH, artifactsDir: config.artifactsDir });

  return app;
}
