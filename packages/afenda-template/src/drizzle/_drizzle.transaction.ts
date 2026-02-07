import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";

/**
 * Transaction utilities with error handling and retry logic.
 *
 * Patterns:
 * - Typed transaction wrappers
 * - Automatic retry on transient errors
 * - Graceful error recovery
 * - Transaction context passing
 */

type DbInstance = NeonHttpDatabase<any> | NeonDatabase<any>;

export class TransactionError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
    public readonly isRetryable: boolean = false
  ) {
    super(message);
    this.name = "TransactionError";
  }
}

export interface TransactionOptions {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number, error: unknown) => void;
  isolationLevel?: "read uncommitted" | "read committed" | "repeatable read" | "serializable";
}

/**
 * Check if an error is retryable (transient database errors).
 */
function isRetryableError(error: unknown): boolean {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as any).code;
    // PostgreSQL transient error codes
    const retryableCodes = [
      "40001", // serialization_failure
      "40P01", // deadlock_detected
      "08006", // connection_failure
      "08003", // connection_does_not_exist
      "57P03", // cannot_connect_now
    ];
    return retryableCodes.includes(code);
  }
  return false;
}

/**
 * Execute a transaction with automatic retry on transient errors.
 */
export async function withTransaction<T>(
  db: DbInstance,
  callback: (tx: any) => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const { maxRetries = 3, retryDelay = 100, onRetry } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        return await callback(tx);
      });
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries && isRetryableError(error)) {
        onRetry?.(attempt + 1, error);
        await sleep(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        continue;
      }

      throw new TransactionError(
        `Transaction failed after ${attempt + 1} attempts`,
        error,
        isRetryableError(error)
      );
    }
  }

  throw new TransactionError("Transaction failed: max retries exceeded", lastError);
}

/**
 * Execute multiple operations in a single transaction.
 */
export async function batch<T extends readonly unknown[]>(
  db: DbInstance,
  operations: { [K in keyof T]: (tx: any) => Promise<T[K]> },
  options?: TransactionOptions
): Promise<T> {
  return withTransaction(
    db,
    async (tx) => {
      const results = (await Promise.all(operations.map((op) => op(tx)))) as {
        [K in keyof T]: Awaited<T[K]>;
      };
      return results as T;
    },
    options
  );
}

/**
 * Conditional transaction: only start if not already in one.
 */
export async function maybeTransaction<T>(
  db: DbInstance | any,
  callback: (tx: any) => Promise<T>
): Promise<T> {
  // Check if db is already a transaction context
  if ("rollback" in db || "_" in db) {
    return callback(db);
  }
  return db.transaction(callback);
}

/**
 * Sleep utility for retry backoff.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Savepoint wrapper for nested transactions.
 */
export async function withSavepoint<T>(
  tx: any,
  name: string,
  callback: () => Promise<T>
): Promise<T> {
  await tx.execute(`SAVEPOINT ${name}`);
  try {
    const result = await callback();
    await tx.execute(`RELEASE SAVEPOINT ${name}`);
    return result;
  } catch (error) {
    await tx.execute(`ROLLBACK TO SAVEPOINT ${name}`);
    throw error;
  }
}
