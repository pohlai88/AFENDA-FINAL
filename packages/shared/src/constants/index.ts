/**
 * Shared constants barrel export.
 * Cross-domain constants that multiple packages can consume.
 */

export { siteConfig } from "./site-config";
export { routes } from "./routes";
export { ADMIN_PATH_TO_CRUD, getResourceCrudForPathname } from "./path-to-crud";
export {
  COMMAND_PALETTE_RECENT_KEY,
  FAB_HINT_DISMISSED_KEY,
  MACHINA_OPEN_EVENT,
} from "./storage-keys";

export * from "./magicdrive";

export const HEADER_NAMES = {
  REQUEST_ID: "x-request-id",
  TRACE_ID: "x-trace-id",
  USER_ID: "x-user-id",
} as const;
