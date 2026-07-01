import type Database from 'better-sqlite3';

export function openDb(_path: string): Database.Database {
  throw new Error('not implemented');
}

export function migrate(_db: Database.Database): void {
  throw new Error('not implemented');
}
