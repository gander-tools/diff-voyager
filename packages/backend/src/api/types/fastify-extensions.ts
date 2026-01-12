/**
 * Type definitions for @ts-rest/fastify and Swagger extensions to Fastify
 *
 * This file provides type-safe wrappers and type guards for runtime metadata
 * that @ts-rest/fastify and @fastify/swagger add to Fastify routes but aren't
 * reflected in the core Fastify TypeScript definitions.
 */

import type { FastifyBaseLogger } from 'fastify';
import type { Logger } from 'pino';

/**
 * @ts-rest route metadata structure
 *
 * This metadata is defined in the API contract and attached to routes at runtime
 * by @ts-rest/fastify, but TypeScript doesn't know about it statically.
 *
 * @see packages/shared/src/api-contract.ts - where metadata is defined
 */
export interface TsRestMetadata {
  /** Swagger/OpenAPI tags for grouping endpoints */
  tags?: readonly string[];
  /** Rate limiting strategy for this endpoint */
  rateLimit?: 'FILE_SYSTEM' | 'LARGE_FILE';
  /** Content-Type header value */
  contentType?: string;
  /** Content-Disposition header value */
  contentDisposition?: string;
}

/**
 * @ts-rest route configuration attached to Fastify RouteOptions.config
 *
 * This structure is added at runtime by @ts-rest/fastify when routes are
 * registered, but it's not reflected in Fastify's type definitions.
 */
export interface TsRestRouteConfig {
  tsRestRoute: {
    summary?: string;
    description?: string;
    metadata?: TsRestMetadata;
  };
}

/**
 * Type guard to check if config has @ts-rest route metadata
 *
 * @param config - Route config from Fastify (typed as unknown)
 * @returns true if config contains tsRestRoute metadata
 *
 * @example
 * ```typescript
 * if (isTsRestRoute(routeOptions.config)) {
 *   const tags = routeOptions.config.tsRestRoute.metadata?.tags;
 * }
 * ```
 */
export function isTsRestRoute(config: unknown): config is TsRestRouteConfig {
  return (
    typeof config === 'object' &&
    config !== null &&
    'tsRestRoute' in config &&
    typeof (config as Record<string, unknown>).tsRestRoute === 'object'
  );
}

/**
 * OpenAPI/Swagger schema extensions for Fastify
 *
 * These properties are added by @fastify/swagger to route schemas for
 * OpenAPI documentation, but they're not in core Fastify's schema types.
 */
export interface SwaggerSchemaExtensions {
  tags?: string[];
  summary?: string;
  description?: string;
}

/**
 * Type guard to check if schema has Swagger tags
 *
 * @param schema - Route schema from Fastify (typed as unknown)
 * @returns true if schema contains Swagger tags array
 *
 * @example
 * ```typescript
 * if (hasSwaggerTags(routeOptions.schema)) {
 *   const tags = routeOptions.schema.tags;
 * }
 * ```
 */
export function hasSwaggerTags(schema: unknown): schema is SwaggerSchemaExtensions {
  return (
    typeof schema === 'object' &&
    schema !== null &&
    'tags' in schema &&
    Array.isArray((schema as Record<string, unknown>).tags)
  );
}

/**
 * Type-safe assertion that FastifyBaseLogger is compatible with Pino Logger
 *
 * FastifyBaseLogger and pino.Logger are structurally compatible (both extend
 * the same interface) but nominally different types. This type represents
 * their intersection for safe conversion.
 */
export type CompatibleLogger = FastifyBaseLogger & Logger;

/**
 * Assert that a FastifyBaseLogger is compatible with Pino Logger
 *
 * This validates structural compatibility at runtime by checking that all
 * required logger methods exist. FastifyBaseLogger and pino.Logger share
 * the same interface, so this is safe.
 *
 * @param logger - Fastify's base logger instance
 * @returns The same logger, typed as compatible with pino.Logger
 * @throws Error if the logger is missing required methods
 *
 * @example
 * ```typescript
 * const { router } = createTsRestRoutes({
 *   logger: assertCompatibleLogger(app.log),
 * });
 * ```
 */
export function assertCompatibleLogger(logger: FastifyBaseLogger): CompatibleLogger {
  // Runtime check to verify structural compatibility
  const requiredMethods = ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'child'] as const;

  for (const method of requiredMethods) {
    if (typeof logger[method] !== 'function') {
      throw new Error(`Logger missing required method: ${method}`);
    }
  }

  return logger as CompatibleLogger;
}
