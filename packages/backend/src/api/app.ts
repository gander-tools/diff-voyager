/**
 * Fastify application setup
 */

import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { API_BASE_PATH, swaggerTags } from '@gander-tools/diff-voyager-shared';
import Fastify, { type FastifyInstance } from 'fastify';
import { stdSerializers } from 'pino';
import { TaskQueue } from '../queue/task-queue.js';
import type { DatabaseInstance } from '../storage/database.js';
import type { DrizzleDb } from '../storage/drizzle/db.js';
import { FILE_SYSTEM_RATE_LIMIT, LARGE_FILE_RATE_LIMIT } from './middleware/rate-limiting.js';
import { createTsRestRoutes } from './routes-ts-rest.js';
import {
  assertCompatibleLogger,
  hasSwaggerTags,
  isTsRestRoute,
} from './types/fastify-extensions.js';

export interface AppConfig {
  db: DatabaseInstance;
  drizzleDb: DrizzleDb;
  artifactsDir: string;
  taskQueue?: TaskQueue; // Optional - will be created if not provided
  logLevelConsole?: string; // Console log level (default: debug in dev, info in prod)
  logLevelFile?: string; // File log level (default: debug)
  disableLogging?: boolean; // Disable logging entirely (for tests)
}

export async function createApp(config: AppConfig): Promise<FastifyInstance> {
  // If logging is disabled (e.g., for tests), create app without logger
  if (config.disableLogging) {
    const app = Fastify({
      logger: false,
    });

    // Skip logger setup, just register plugins
    await registerPlugins(app, config);
    return app;
  }

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

  // Log configured log levels
  app.log.info(`Logger configured: console=${logLevelConsole}, file=${logLevelFile}`);

  await registerPlugins(app, config);
  return app;
}

/**
 * Register all Fastify plugins and routes
 */
async function registerPlugins(app: FastifyInstance, config: AppConfig) {
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

  // Add onRoute hook to create schema for @ts-rest routes (so Swagger can see them)
  app.addHook('onRoute', (routeOptions) => {
    // Check if this is a @ts-rest route (has tsRestRoute in config but no schema)
    if (isTsRestRoute(routeOptions.config) && !routeOptions.schema) {
      const tsRestRoute = routeOptions.config.tsRestRoute;
      // 1. Read tags from metadata (NO URL pattern matching!)
      const tags = tsRestRoute.metadata?.tags || [];

      // 2. Create schema for Swagger
      routeOptions.schema = {
        tags,
        summary: tsRestRoute.summary || '',
        description: tsRestRoute.description || '',
      };

      // 3. Apply rate limiting from metadata
      const rateLimitType = tsRestRoute.metadata?.rateLimit;
      if (rateLimitType === 'FILE_SYSTEM' && routeOptions.config) {
        Object.assign(routeOptions.config, FILE_SYSTEM_RATE_LIMIT);
      } else if (rateLimitType === 'LARGE_FILE' && routeOptions.config) {
        Object.assign(routeOptions.config, LARGE_FILE_RATE_LIMIT);
      }

      app.log.debug(
        {
          url: routeOptions.url,
          tags,
          rateLimitType,
        },
        'Route registered with @ts-rest metadata',
      );
    } else if (routeOptions.schema && routeOptions.url?.startsWith(API_BASE_PATH)) {
      // Legacy routes (e.g., health) - just log
      const tags = hasSwaggerTags(routeOptions.schema) ? routeOptions.schema.tags : undefined;

      app.log.debug(
        {
          url: routeOptions.url,
          tags,
        },
        'Legacy route registered',
      );
    }
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
      tags: swaggerTags,
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
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

  // Register @ts-rest routes
  const taskQueue = config.taskQueue || new TaskQueue(config.db);
  const { router: tsRestRouter, s: tsRestServer } = createTsRestRoutes({
    db: config.db,
    drizzleDb: config.drizzleDb,
    artifactsDir: config.artifactsDir,
    taskQueue,
    logger: assertCompatibleLogger(app.log),
  });

  await app.register(tsRestServer.plugin(tsRestRouter), {
    prefix: API_BASE_PATH,
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
}
