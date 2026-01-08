import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/storage/drizzle/schema/index.ts',
  out: './src/storage/drizzle/migrations',
  dialect: 'sqlite',
  driver: 'better-sqlite3',
  dbCredentials: {
    url: process.env.DB_PATH || './data/diff-voyager.db',
  },
});
