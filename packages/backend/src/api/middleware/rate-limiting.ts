/**
 * Rate limiting middleware configurations for different operation types
 */

import type { RouteOptions } from "fastify";

/**
 * Rate limit configuration for file system operations (reading artifacts)
 * Applied to endpoints that serve files from disk
 */
export const FILE_SYSTEM_RATE_LIMIT: RouteOptions["config"] = {
	rateLimit: {
		max: 50,
		timeWindow: "1 minute",
	},
};

/**
 * Rate limit configuration for large file operations (HAR, HTML)
 * Applied to endpoints serving potentially large files
 */
export const LARGE_FILE_RATE_LIMIT: RouteOptions["config"] = {
	rateLimit: {
		max: 30,
		timeWindow: "1 minute",
	},
};

/**
 * Rate limit configuration for expensive operations (crawling, scanning)
 * Applied to endpoints that perform resource-intensive tasks
 */
export const EXPENSIVE_OPERATION_RATE_LIMIT: RouteOptions["config"] = {
	rateLimit: {
		max: 10,
		timeWindow: "1 minute",
	},
};

/**
 * Rate limit configuration for database read operations
 * Applied to endpoints that perform database queries
 */
export const DATABASE_READ_RATE_LIMIT: RouteOptions["config"] = {
	rateLimit: {
		max: 100,
		timeWindow: "1 minute",
	},
};
