/**
 * Single barrier export for all constants in this package.
 * Consumers MUST import only from this index, never from individual files.
 * This ensures consistency, prevents drift, and enables easy refactoring.
 *
 * Golden Rule: Import from `@/afenda` (package entrypoint) or `@/afenda/src/constant` (this file).
 *
 * ✅ Correct:
 *   import { HTTP_STATUS, route } from "@/afenda";
 *   import { isHttpStatus, validatePageSize } from "@/afenda/src/constant";
 *
 * ❌ Wrong:
 *   import { HTTP_STATUS } from "@/afenda/src/constant/afenda.constant.http";
 */

export * from "./afenda.constant.api";
export * from "./afenda.constant.cache";
export * from "./afenda.constant.cookies";
export * from "./afenda.constant.datetime";
export * from "./afenda.constant.defaults";
export * from "./afenda.constant.env";
export * from "./afenda.constant.errors";
export * from "./afenda.constant.feature-flags";
export * from "./afenda.constant.files";
export * from "./afenda.constant.headers";
export * from "./afenda.constant.http";
export * from "./afenda.constant.limits";
export * from "./afenda.constant.logging";
export * from "./afenda.constant.mime";
export * from "./afenda.constant.pagination";
export * from "./afenda.constant.permissions";
export * from "./afenda.constant.regex";
export * from "./afenda.constant.routes";
export * from "./afenda.constant.status";
export * from "./afenda.constant.validation";

// ⭐ Type guards and validators (runtime safety & consistency enforcement)
export * from "./afenda.constant.guards";

// ⭐ Core helpers (generic utilities for constant-layer patterns)
export * from "./afenda.core.helper";
