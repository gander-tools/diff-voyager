import Database from "better-sqlite3";

export function openDb(path: string): Database.Database {
  throw new Error("not implemented");
}

export function migrate(db: Database.Database): void {
  throw new Error("not implemented");
}
