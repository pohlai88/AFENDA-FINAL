// Drizzle stage barrel exports
export * from "./magictodo.schema";

/**
 * Type alias for Drizzle database instance.
 * Use this type for all service method parameters instead of 'any'.
 */
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./magictodo.schema";

export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;
