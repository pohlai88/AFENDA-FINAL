/**
 * Shared constants barrel export.
 * Cross-domain constants that multiple packages can consume.
 *
 * @domain shared
 * @layer constants
 */

export { siteConfig, type SiteConfig } from "./site-config";
export { routes, type Routes } from "./routes";
export { ADMIN_PATH_TO_CRUD, getResourceCrudForPathname } from "./path-to-crud";
export {
  COMMAND_PALETTE_RECENT_KEY,
  FAB_HINT_DISMISSED_KEY,
  MACHINA_OPEN_EVENT,
} from "./storage-keys";

export * from "./magicdrive";

/**
 * Standard HTTP header names used across the platform.
 * For kernel-specific headers (TRACE_ID, ACTOR_ID), use `KERNEL_HEADERS` from `@afenda/orchestra`.
 */
export const HEADER_NAMES = {
  REQUEST_ID: "x-request-id",
  TRACE_ID: "x-trace-id",
  USER_ID: "x-user-id",
} as const;
