/**
 * Shared package barrel export.
 * Cross-domain infrastructure — interfaces, pure UI, and system utilities.
 *
 * @example
 * import { siteConfig, routes } from "@afenda/shared/constants";
 * import { db } from "@afenda/shared/server/db";
 * import { TagPicker, SavedViewManager, BulkActionToolbar } from "@afenda/shared";
 */

// Re-export constants for convenience
export * from "./constants";

// Re-export drizzle schemas
export * from "./drizzle";

// Re-export shared infrastructure patterns
export * from "./tags";
export * from "./saved-views";
export * from "./bulk-actions";

// Re-export shared utils
export * from "./utils";

// Re-export shared hooks
export * from "./hooks";
