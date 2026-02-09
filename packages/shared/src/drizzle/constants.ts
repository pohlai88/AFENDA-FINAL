/**
 * @layer shared
 * @responsibility Central Drizzle schema constants — single source of truth.
 *
 * Prevents naming drift across domain schemas by enforcing a single
 * definition for table prefixes, PK strategies, index naming, FK naming,
 * and timestamp configuration.
 *
 * @example
 * ```ts
 * import { SCHEMA, TIMESTAMP_CONFIG } from "@afenda/shared/drizzle/constants";
 * // or via barrel: import { SCHEMA } from "@afenda/shared/drizzle";
 * ```
 */

// ─── Domain Table Prefixes ───────────────────────────────────────────
// Every table must be prefixed with its domain name to avoid conflicts.

export const DOMAIN_PREFIX = {
  ORCHESTRA: "orchestra_",
  MAGICTODO: "magictodo_",
  MAGICDRIVE: "magicdrive_",
  TENANCY: "tenancy_",
} as const;

export type DomainPrefix = (typeof DOMAIN_PREFIX)[keyof typeof DOMAIN_PREFIX];

// ─── Primary Key Strategy ────────────────────────────────────────────
// Document the convention; enforced via code review / schema tests.

/**
 * PK strategy contract:
 * - `text`   → entity tables (projects, tasks, objects, orgs, teams)
 * - `uuid`   → audit/log/junction tables (audit_logs, invitations, time_entries)
 *
 * Text PKs use CUID2/nanoid for URL-friendliness; UUID PKs use defaultRandom().
 */
export const PK_STRATEGY = {
  /** Use for entity tables with CUID2/nanoid IDs */
  TEXT: "text",
  /** Use for audit logs, junctions, and auto-generated rows */
  UUID: "uuid",
} as const;

// ─── Timestamp Configuration ─────────────────────────────────────────
// DRY the repeated `{ withTimezone: true, mode: "date" }` config.

export const TIMESTAMP_CONFIG = {
  withTimezone: true,
  mode: "date",
} as const;

// ─── Index & FK Naming Conventions ───────────────────────────────────

/**
 * Standard index prefix: `idx_{tableName}_{columnName}`
 *
 * @example `idx_magictodo_tasks_organization_id`
 */
export const INDEX_PREFIX = "idx_" as const;

/**
 * Standard FK prefix: `fk_{tableName}_{targetDomain}`
 *
 * @example `fk_magictodo_tasks_organization`
 */
export const FK_PREFIX = "fk_" as const;

// ─── FK ON DELETE Defaults ───────────────────────────────────────────

export const ON_DELETE_DEFAULTS = {
  /** Tenancy FKs: set null when parent org/team is deleted */
  TENANCY: "set null",
  /** Child FKs: cascade when parent entity is deleted */
  CHILD: "cascade",
} as const;

// ─── Aggregate Export ────────────────────────────────────────────────
// Convenience namespace for imports: `import { SCHEMA } from "..."`.

export const SCHEMA = {
  DOMAIN_PREFIX,
  PK_STRATEGY,
  TIMESTAMP_CONFIG,
  INDEX_PREFIX,
  FK_PREFIX,
  ON_DELETE_DEFAULTS,
} as const;
