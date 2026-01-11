/**
 * Fastify application setup
 */

import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { API_BASE_PATH } from '@gander-tools/diff-voyager-shared';
import Fastify, { type FastifyInstance } from 'fastify';
import { stdSerializers } from 'pino';
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
  logLevelConsole?: string; // Console log level (default: debug in dev, info in prod)
  logLevelFile?: string; // File log level (default: debug)
}

export async function createApp(config: AppConfig): Promise<FastifyInstance> {
  // Ensure logs directory exists
  const logsDir = join(process.cwd(), 'data', 'logs');
  await mkdir(logsDir, { recursive: true, mode: 0o700 });

  // Configure Pino logger with multiple transports
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const defaultLogLevel = isDevelopment ? 'debug' : 'info';

  // Use provided log levels or defaults
  const logLevelConsole = config.logLevelConsole || defaultLogLevel;
  const logLevelFile = config.logLevelFile || 'debug';

  // The base logger level must be the lowest of all transports
  const baseLogLevel =
    ['trace', 'debug', 'info', 'warn', 'error', 'fatal'].indexOf(logLevelConsole) <
    ['trace', 'debug', 'info', 'warn', 'error', 'fatal'].indexOf(logLevelFile)
      ? logLevelConsole
      : logLevelFile;

  const app = Fastify({
    logger: {
      level: baseLogLevel,
      // Serialize errors with full stack trace
      serializers: {
        err: stdSerializers.err,
        error: stdSerializers.err,
      },
      transport: {
        targets: [
          // Console transport with pino-pretty (colored, human-readable)
          {
            target: 'pino-pretty',
            level: logLevelConsole,
            options: {
              colorize: true,
              translateTime: 'SYS:HH:MM:ss',
              ignore: 'pid,hostname',
              singleLine: false,
              // Show minimal info in console, full details in file
              errorLikeObjectKeys: ['err', 'error'],
            },
          },
          // File transport with full error stack traces
          {
            target: 'pino/file',
            level: logLevelFile,
            options: {
              destination: join(logsDir, 'app.log'),
              mkdir: true,
            },
          },
        ],
      },
    },
    // Disable request logging for health checks (too noisy)
    disableRequestLogging: false,
  });

  // Register CORS plugin
  await app.register(cors, {
    origin: true, // Allow all origins in development
    credentials: true,
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

  // Log configured log levels
  app.log.info(`Logger configured: console=${logLevelConsole}, file=${logLevelFile}`);

  return app;
}
