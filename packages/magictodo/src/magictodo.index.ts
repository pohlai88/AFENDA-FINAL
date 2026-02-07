/**
 * magictodo domain barrel exports (client-safe).
 * Import from "@afenda/magictodo" for hooks, queries, client components, etc.
 *
 * Server-only code must be imported from dedicated entrypoints:
 * - "@afenda/magictodo/server" — server services
 * - "@afenda/magictodo/component/server" — Server Components (e.g. MagictodoServerCard)
 */

// Database schemas
export * from "./drizzle";

// API contracts
export * from "./zod";

// Client state management
export * from "./zustand";

// React hooks
export * from "./hooks";

// TanStack Query hooks
export * from "./query";

// Storage adapters
export * from "./storage";

// Constants
export * from "./constant";

// Logging
export * from "./pino";

// Client components only (server components live in @afenda/magictodo/component/server)
export * from "./component/client";
