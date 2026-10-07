import type { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import type * as schema from "./schema";

/**
 * The database every call site sees. The remote (async) shape is the
 * contract: the local better-sqlite3 instance is sync under the hood, but
 * its query builders are thenable and every consumer awaits its results,
 * so both drivers satisfy the same interface with no branching anywhere
 * in the application code.
 */
export type PandaDatabase = SqliteRemoteDatabase<typeof schema>;
