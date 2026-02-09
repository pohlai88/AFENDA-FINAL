/**
 * Schema Manifest — Table Metadata Registry
 * 
 * Central registry for validating schema compliance.
 * Used by CI to enforce best practices.
 */

import type { PgTable as _PgTable } from "drizzle-orm/pg-core";

export interface TableMetadata {
  /** Table name */
  name: string;
  /** Domain prefix */
  domain: "orchestra" | "magictodo" | "magicdrive" | "tenancy";
  /** Has tenant_id column */
  hasTenantId: boolean;
  /** Has team_id column */
  hasTeamId: boolean;
  /** Has user_id column */
  hasUserId: boolean;
  /** RLS enabled with policies */
  hasRLS: boolean;
  /** Has createdAt + updatedAt */
  hasTimestamps: boolean;
  /** Has isDeleted + deletedAt */
  hasSoftDelete: boolean;
  /** PK strategy */
  pkStrategy: "text" | "uuid" | "bigint";
  /** Is infrastructure/admin table (no tenancy required) */
  isInfrastructure: boolean;
}

/**
 * Global registry — populated by domain packages
 */
const registry = new Map<string, TableMetadata>();

/**
 * Register a table's metadata
 */
export function registerTable(metadata: TableMetadata) {
  registry.set(metadata.name, metadata);
}

/**
 * Get all registered tables
 */
export function getAllTables(): TableMetadata[] {
  return Array.from(registry.values());
}

/**
 * Validate registry compliance
 * 
 * Throws if any table violates best practices:
 * - Domain tables must have tenant_id
 * - Domain tables must have RLS
 * - Domain tables must have timestamps
 */
export function validateRegistry(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const table of registry.values()) {
    // Infrastructure tables skip tenancy requirements
    if (table.isInfrastructure) {
      if (!table.hasRLS) {
        errors.push(`Infrastructure table "${table.name}" should have RLS (read-only policies)`);
      }
      continue;
    }
    
    // Domain tables must have tenant_id
    if (!table.hasTenantId) {
      errors.push(`Domain table "${table.name}" missing tenant_id column`);
    }
    
    // Domain tables must have RLS
    if (!table.hasRLS) {
      errors.push(`Domain table "${table.name}" missing RLS policies`);
    }
    
    // All tables should have timestamps (except junction tables)
    if (!table.hasTimestamps && !table.name.includes("_queue") && !table.name.includes("_dependencies")) {
      errors.push(`Table "${table.name}" missing timestamps (createdAt/updatedAt)`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate registry report (for CI/debugging)
 */
export function generateReport(): string {
  const tables = getAllTables();
  const byDomain = tables.reduce((acc, t) => {
    if (!acc[t.domain]) acc[t.domain] = [];
    acc[t.domain].push(t);
    return acc;
  }, {} as Record<string, TableMetadata[]>);
  
  let report = "# Schema Manifest Registry Report\n\n";
  
  for (const [domain, domainTables] of Object.entries(byDomain)) {
    report += `## ${domain} (${domainTables.length} tables)\n\n`;
    for (const t of domainTables) {
      report += `- **${t.name}**\n`;
      report += `  - Tenant: ${t.hasTenantId ? "✅" : "❌"} | Team: ${t.hasTeamId ? "✅" : "—"} | User: ${t.hasUserId ? "✅" : "—"}\n`;
      report += `  - RLS: ${t.hasRLS ? "✅" : "❌"} | Timestamps: ${t.hasTimestamps ? "✅" : "—"} | Soft Delete: ${t.hasSoftDelete ? "✅" : "—"}\n`;
      report += `  - PK: ${t.pkStrategy}\n\n`;
    }
  }
  
  return report;
}
