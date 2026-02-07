import { optimizeConnectionString } from "./_drizzle.neon.optimizations";

type DatabaseTarget = "http" | "pool" | "ws";

const TARGET_ENV_KEYS: Record<DatabaseTarget, readonly string[]> = {
  http: ["DATABASE_URL", "NEON_DATABASE_URL"],
  pool: ["DATABASE_POOL_URL", "DATABASE_URL"],
  ws: ["DATABASE_WS_URL", "DATABASE_URL"],
};

function readEnv(key: string): string | undefined {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

/**
 * Resolve a Neon connection string for the desired transport.
 * Falls back gracefully while still throwing a descriptive error if nothing is set.
 */
export function resolveDatabaseUrl(target: DatabaseTarget = "http"): string {
  for (const key of TARGET_ENV_KEYS[target]) {
    const value = readEnv(key);
    if (value) {
      return optimizeConnectionString(value, {
        pooling: target === "pool",
        ssl: true,
        statement_cache_size: target === "http" ? 0 : undefined,
      });
    }
  }

  const expected = TARGET_ENV_KEYS[target].join(" or ");
  throw new Error(`[drizzle] Missing ${expected} environment variable for ${target} connection`);
}

export function parseNumberEnv(key: string, fallback?: number): number | undefined {
  const raw = readEnv(key);
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function resolveBooleanEnv(key: string, fallback = false): boolean {
  const raw = readEnv(key);
  if (!raw) return fallback;
  return raw === "1" || raw.toLowerCase() === "true" || raw.toLowerCase() === "yes";
}

export function shouldLogDbQueries(): boolean {
  return resolveBooleanEnv("LOG_DB_QUERIES");
}
