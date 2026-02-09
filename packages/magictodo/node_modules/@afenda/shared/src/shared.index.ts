/**
 * Shared package barrel export.
 * Cross-domain infrastructure — interfaces, pure UI, and system utilities.
 *
 * Import paths:
 *  - `@afenda/shared`            — this barrel (constants, tags, saved-views, bulk-actions, utils, hooks)
 *  - `@afenda/shared/server`     — server utilities (db, envelope, validation)
 *  - `@afenda/shared/server/db`  — database connection only
 *  - `@afenda/shared/constants`  — route and site constants
 *  - `@afenda/shared/drizzle`    — aggregated Drizzle schemas
 *  - `@afenda/shared/r2`         — R2/S3-compatible storage client
 *  - `@afenda/shared/tags`       — generic tagging infrastructure
 *  - `@afenda/shared/saved-views`— generic saved view / filter persistence
 *  - `@afenda/shared/bulk-actions`— generic bulk selection & actions
 *  - `@afenda/shared/attachments` — cross-domain ID-based linking
 *  - `@afenda/shared/utils`      — cn(), client logger
 *  - `@afenda/shared/hooks`      — shared React hooks (deprecated domain-specific ones migrated)
 *
 * @domain shared
 */

// Re-export constants for convenience
export * from "./constants";

// Re-export drizzle schemas
export * from "./drizzle";

// Re-export shared infrastructure patterns
export * from "./tags";
export * from "./saved-views";
export * from "./bulk-actions";
export * from "./attachments";

// Re-export shared utils
export * from "./utils";

// Re-export shared hooks
export * from "./hooks";
