import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";

import { parseNumberEnv, resolveDatabaseUrl, shouldLogDbQueries } from "./_drizzle.env";

/**
 * Neon connection pool driver (recommended for long-lived servers).
 */

const poolConfig = {
  connectionString: resolveDatabaseUrl("pool"),
  max: parseNumberEnv("NEON_POOL_MAX", 10),
  min: parseNumberEnv("NEON_POOL_MIN", 1),
  idleTimeoutMillis: parseNumberEnv("NEON_POOL_IDLE_MS", 30_000),
};

export const pool = new Pool({
  connectionString: poolConfig.connectionString,
  max: poolConfig.max,
  min: poolConfig.min,
  idleTimeoutMillis: poolConfig.idleTimeoutMillis,
});

export const poolDb = drizzle(pool, {
  logger: shouldLogDbQueries(),
});

export type PoolDb = typeof poolDb;

/**
 * Graceful shutdown helper.
 */
export async function closePool() {
  await pool.end();
}

// Back-compat alias
export { poolDb as db };
