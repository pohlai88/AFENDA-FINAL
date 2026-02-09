/**
 * Schema Manifest — Unified Schema Infrastructure
 * 
 * Single source of truth for Neon-Drizzle best practices.
 * All new tables MUST use these factories.
 * 
 * @see .dev-note/multi-tenancy-schema.md for design rationale
 */

export * from "./columns";
export * from "./indexes";
export * from "./foreign-keys";
export * from "./roles";
export * from "./policies";
export * from "./registry";

/**
 * Re-export constants for convenience
 */
export {
  DOMAIN_PREFIX,
  PK_STRATEGY,
  TIMESTAMP_CONFIG,
  INDEX_PREFIX,
  FK_PREFIX,
  ON_DELETE_DEFAULTS,
  SCHEMA,
  type DomainPrefix,
} from "../constants";
