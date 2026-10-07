import { storageMode } from "../config";
import type { PandaDatabase } from "./types";

/**
 * Driver switch. D1 over REST when the three Cloudflare env vars are set,
 * otherwise a local SQLite file. One promise is created and shared, so
 * both drivers initialize exactly once per process. The drivers are
 * imported dynamically: a Worker bundle never pulls in better-sqlite3 and
 * a Node host never pulls in the REST client it is not using.
 */

let instance: Promise<PandaDatabase> | null = null;

export function getDb(): Promise<PandaDatabase> {
  if (!instance) {
    instance =
      storageMode() === "d1"
        ? import("./d1").then((m) => m.getD1Db())
        : import("./sqlite").then((m) => m.getSqliteDb());
  }
  return instance;
}
