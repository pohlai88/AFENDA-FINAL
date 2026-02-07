/**
 * Trace helpers (NOT constants).
 * - Generates stable request/operation trace IDs
 * - Works in Node + browsers that support crypto.randomUUID()
 */

export function createTraceId(prefix: string = "tr"): string {
  const rand = randomId();
  return prefix ? `${prefix}_${rand}` : rand;
}

function randomId(): string {
  // Prefer Web Crypto UUID when available.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = globalThis as any;
  const uuid = c?.crypto?.randomUUID?.bind(c.crypto);
  if (typeof uuid === "function") return uuid();

  // Fallback: time + random (best effort)
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 10);
  return `${t}_${r}`;
}
