import path from "path";

export const DB_PATH = process.env.DB_PATH ?? path.resolve("data/voyager.db");
export const SNAPSHOT_DIR = process.env.SNAPSHOT_DIR ?? path.resolve("snapshots");
export const CONFIG_PATH = process.env.CONFIG_PATH ?? path.resolve("config.json");
export const LOG_DIR = process.env.LOG_DIR ?? path.resolve("logs");
