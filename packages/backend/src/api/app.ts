/**
 * Fastify application setup
 */

import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { API_BASE_PATH } from '@gander-tools/diff-voyager-shared';
import Fastify, { type FastifyInstance } from 'fastify';
import type { DatabaseInstance } from '../storage/database.js';
import { registerArtifactRoutes } from './routes/artifacts.js';
import { registerProjectRoutes } from './routes/projects.js';
import { registerScanRoutes } from './routes/scans.js';
import { registerTaskRoutes } from './routes/tasks.js';

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

  // Register routes
  await app.register(registerScanRoutes, {
    prefix: API_BASE_PATH,
    db: config.db,
    artifactsDir: config.artifactsDir,
  });
  await app.register(registerProjectRoutes, {
    prefix: API_BASE_PATH,
    db: config.db,
  });
  await app.register(registerTaskRoutes, {
    prefix: API_BASE_PATH,
    db: config.db,
  });
  await app.register(registerArtifactRoutes, {
    prefix: API_BASE_PATH,
    artifactsDir: config.artifactsDir,
  });

  return app;
}
