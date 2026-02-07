import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import { Client, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

import { resolveDatabaseUrl, shouldLogDbQueries } from "./_drizzle.env";

/**
 * Neon WebSocket (interactive) driver.
 * Creates a live session capable of multi-statement transactions.
 *
 * Usage:
 * ```ts
 * const { db, close } = await createNeonWebSocketDb();
 * await db.transaction(async (tx) => { ... });
 * await close();
 * ```
 */

const WebSocketImpl: typeof globalThis.WebSocket =
  typeof (globalThis as any).WebSocket !== "undefined"
    ? (globalThis as any).WebSocket
    : ((ws as unknown) as typeof globalThis.WebSocket);

neonConfig.webSocketConstructor = WebSocketImpl;

export interface NeonWebSocketConnection {
  db: NeonDatabase;
  client: Client;
  close: () => Promise<void>;
}

export async function createNeonWebSocketDb(): Promise<NeonWebSocketConnection> {
  const client = new Client({ connectionString: resolveDatabaseUrl("ws") });
  await client.connect();
  const db = drizzle(client, { logger: shouldLogDbQueries() });

  return {
    db,
    client,
    close: () => client.end(),
  };
}

let singleton: Promise<NeonWebSocketConnection> | null = null;

/**
 * Lazily create/reuse a single WebSocket session.
 */
export function getNeonWebSocketDb(): Promise<NeonWebSocketConnection> {
  if (!singleton) {
    singleton = createNeonWebSocketDb();
  }
  return singleton;
}
