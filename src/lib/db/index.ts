import { storageMode } from "../config";
import type { PandaDatabase } from "./types";

/**
 * Driver switch. A Cloudflare Worker or OpenNext development runtime gets
 * the native D1 binding. A plain local Node server keeps using SQLite.
 * If a deployment explicitly asks for D1 but misses the binding, fail
 * closed instead of silently creating a separate local database.
 */

let instance: Promise<PandaDatabase> | null = null;

export function getDb(): Promise<PandaDatabase> {
  if (!instance) {
    instance = import("./d1")
      .then((m) => m.getD1Db())
      .catch(async (error) => {
        if (storageMode() === "d1") throw error;
        return import("./sqlite").then((m) => m.getSqliteDb());
      });
  }
  return instance;
}
