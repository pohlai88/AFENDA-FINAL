// Drizzle stage barrel exports
export * from "./magictodo.schema";

/**
 * Type alias for Drizzle database instance.
 * Use this type for all service method parameters instead of 'any'.
 * Type-only imports prevent drizzle-orm from leaking into the client bundle.
 */
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import type * as schema from "./magictodo.schema";

export type DrizzleDB = NeonHttpDatabase<typeof schema>;
