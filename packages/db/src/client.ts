import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let _db: DrizzleDb | null = null;

function init(): DrizzleDb {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add Neon Postgres via Vercel Marketplace or set it locally in .env.local",
    );
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
}

/**
 * Lazy proxy around the Drizzle client. Constructing the real connection is
 * deferred until the first property access so that:
 *   - Next.js can collect route metadata at build time without DATABASE_URL set
 *   - Modules that merely `import { db }` for typing don't crash if env is missing
 *
 * In practice consumers keep writing `db.select(...)` etc. — exactly as before.
 */
export const db: DrizzleDb = new Proxy({} as DrizzleDb, {
  get(_target, prop, receiver) {
    if (!_db) _db = init();
    return Reflect.get(_db as object, prop, receiver);
  },
});

export type Db = DrizzleDb;
