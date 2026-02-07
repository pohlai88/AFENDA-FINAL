import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";

import { resolveDatabaseUrl, shouldLogDbQueries } from "./_drizzle.env";

/**
 * Neon HTTP driver
 * - Best for stateless executions (edge/serverless handlers).
 * - Uses Neon fetch connection cache for optimal reuse.
 */

neonConfig.fetchConnectionCache = true;

const DATABASE_URL = resolveDatabaseUrl("http");

export const httpSql = neon(DATABASE_URL);
export const httpDb = drizzle(httpSql, {
  logger: shouldLogDbQueries(),
});

export type HttpDb = typeof httpDb;

// Backwards compatible named exports
export { httpSql as sql, httpDb as db };
