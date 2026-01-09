/**
 * Fastify application setup
 */

import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { API_BASE_PATH } from '@gander-tools/diff-voyager-shared';
import Fastify, { type FastifyInstance } from 'fastify';
import { TaskQueue } from '../queue/task-queue.js';
import type { DatabaseInstance } from '../storage/database.js';
import type { DrizzleDb } from '../storage/drizzle/db.js';
import { registerArtifactRoutes } from './routes/artifacts.js';
import { registerPageRoutes } from './routes/pages.js';
import { registerProjectRoutes } from './routes/projects.js';
import { registerRunRoutes } from './routes/runs.js';
import { registerScanRoutes } from './routes/scans.js';
import { registerTaskRoutes } from './routes/tasks.js';
import { createTsRestRoutes } from './routes-ts-rest.js';

export interface AppConfig {
  db: DatabaseInstance;
  drizzleDb: DrizzleDb;
  artifactsDir: string;
  taskQueue?: TaskQueue; // Optional - will be created if not provided
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

  // Register Swagger
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Diff Voyager API',
        description: 'API for web page comparison and crawling',
        version: '0.1.1',
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
      ],
      tags: [
        { name: 'scans', description: 'Scan and crawl operations' },
        { name: 'projects', description: 'Project management' },
        { name: 'runs', description: 'Comparison runs' },
        { name: 'pages', description: 'Page details and diffs' },
        { name: 'tasks', description: 'Task status and monitoring' },
        { name: 'artifacts', description: 'Access captured artifacts' },
        { name: 'health', description: 'Health check' },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // Error handler
  app.setErrorHandler(
    (error: Error & { statusCode?: number; validation?: unknown }, _request, reply) => {
      const statusCode = error.statusCode || 500;
      reply.status(statusCode).send({
        error: {
          code: statusCode === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
          message: error.message,
          details: error.validation || undefined,
        },
      });
    },
  );

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
  app.get(
    '/health',
    {
      schema: {
        tags: ['health'],
        description: 'Check API health status',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['ok'] },
            },
          },
        },
      },
    },
    async () => {
      return { status: 'ok' };
    },
  );

  // Register @ts-rest routes (NEW - type-safe API contract)
  const taskQueue = config.taskQueue || new TaskQueue(config.db);
  const { router: tsRestRouter, s: tsRestServer } = createTsRestRoutes({
    db: config.db,
    drizzleDb: config.drizzleDb,
    artifactsDir: config.artifactsDir,
    taskQueue,
  });

  await app.register(tsRestServer.plugin(tsRestRouter), {
    prefix: API_BASE_PATH,
  });

  // OLD routes - TODO: Remove after verifying @ts-rest routes work
  // Keeping for now for backwards compatibility
  await app.register(registerScanRoutes, {
    prefix: `${API_BASE_PATH}/old`,
    db: config.db,
    artifactsDir: config.artifactsDir,
  });
  await app.register(registerProjectRoutes, {
    prefix: `${API_BASE_PATH}/old`,
    db: config.db,
  });
  await app.register(registerRunRoutes, {
    prefix: `${API_BASE_PATH}/old`,
    db: config.db,
  });
  await app.register(registerPageRoutes, {
    prefix: `${API_BASE_PATH}/old`,
    db: config.db,
  });
  await app.register(registerTaskRoutes, {
    prefix: `${API_BASE_PATH}/old`,
    db: config.db,
  });
  await app.register(registerArtifactRoutes, {
    prefix: API_BASE_PATH,
    artifactsDir: config.artifactsDir,
  });

  return app;
}
