import { index, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * Index helpers (deterministic names).
 */

export function idx(name: string) {
  return index(name);
}

export function uidx(name: string) {
  return uniqueIndex(name);
}
