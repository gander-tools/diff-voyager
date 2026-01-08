/**
 * Drizzle database connection helper
 * Creates type-safe Drizzle instance from better-sqlite3 connection
 */

import type Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema/index.js';

/**
 * Create a Drizzle database instance from a better-sqlite3 connection
 *
 * This allows parallel operation of raw SQL and Drizzle queries during migration.
 *
 * @param sqliteDb - better-sqlite3 database instance
 * @returns Type-safe Drizzle database instance with schema
 */
export function createDrizzleDb(sqliteDb: Database.Database) {
  return drizzle(sqliteDb, { schema });
}

/**
 * Type-safe Drizzle database instance
 */
export type DrizzleDb = ReturnType<typeof createDrizzleDb>;
