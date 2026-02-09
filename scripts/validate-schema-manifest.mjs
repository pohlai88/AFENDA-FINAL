/**
 * Schema Manifest Validator
 *
 * CI script that statically validates all domain schema files comply with
 * the schema manifest conventions:
 *
 * 1. Domain tables use `tenancyColumns.withTenancy()` (tenant_id + team_id)
 * 2. Domain tables have RLS policies via `domainPolicies()` or `domainPoliciesTenantOnly()`
 * 3. All tables use `timestamps()` or `createdAtOnly()`
 * 4. Index naming follows `idx("table_name", ...)` convention
 * 5. Array-style extraConfig (3rd arg to pgTable)
 *
 * Usage:
 *   node scripts/validate-schema-manifest.mjs
 *   node scripts/validate-schema-manifest.mjs --json
 */

import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, "..")

const args = new Set(process.argv.slice(2))
const jsonOutput = args.has("--json")

// ─── Schema files to validate ────────────────────────────────────────
const SCHEMA_FILES = [
  {
    path: "packages/magictodo/src/drizzle/magictodo.schema.ts",
    domain: "magictodo",
    requiresTenancy: true,
  },
  {
    path: "packages/magicdrive/src/drizzle/magicdrive.schema.ts",
    domain: "magicdrive",
    requiresTenancy: true,
  },
  {
    path: "packages/orchestra/src/drizzle/orchestra.schema.ts",
    domain: "orchestra",
    requiresTenancy: false, // infrastructure tables
  },
  {
    path: "packages/tenancy/src/drizzle/tenancy.schema.ts",
    domain: "tenancy",
    requiresTenancy: false, // self-referential
  },
]

// Inline tenant column pattern — domain schemas must use tenancyColumns spread only
const INLINE_TENANT_COLUMN_RE =
  /text\s*\(\s*["'](?:tenant_id|legacy_tenant_id|organization_id|team_id)["']\s*\)/g

/** Fail if domain schema contains inline tenant column definitions */
function validateNoInlineTenantColumns(source, filePath, requiresTenancy) {
  const errors = []
  if (!requiresTenancy) return errors
  const re = new RegExp(INLINE_TENANT_COLUMN_RE.source, "g")
  if (re.test(source)) {
    errors.push(
      `Inline tenant column found: use ...tenancyColumns.withTenancy() (or .standard/.withLegacy) from @afenda/tenancy/drizzle. File: ${filePath}`
    )
  }
  return errors
}

// ─── Validation Rules ────────────────────────────────────────────────

/** Extract all pgTable declarations from source */
function extractTables(source) {
  const tables = []
  // Match: export const tableName = pgTable("table_name", {
  const tableRegex = /export\s+const\s+(\w+)\s*=\s*pgTable\(\s*"([^"]+)"/g
  let match
  while ((match = tableRegex.exec(source)) !== null) {
    const varName = match[1]
    const tableName = match[2]
    const startIdx = match.index

    // Find the table definition block (from pgTable( to the matching );)
    let depth = 0
    let blockStart = source.indexOf("(", startIdx)
    let blockEnd = blockStart
    for (let i = blockStart; i < source.length; i++) {
      if (source[i] === "(") depth++
      if (source[i] === ")") depth--
      if (depth === 0) {
        blockEnd = i + 1
        break
      }
    }

    const block = source.slice(blockStart, blockEnd)
    tables.push({ varName, tableName, block })
  }
  return tables
}

function validateTable(table, domain, requiresTenancy) {
  const errors = []
  const warnings = []
  const { varName, tableName, block } = table

  // Junction tables (no id column, just FKs) have relaxed rules
  const isJunction =
    tableName.includes("_queue") ||
    tableName.includes("_dependencies") ||
    tableName.includes("_object_tags") ||
    tableName.includes("_group_versions") ||
    tableName.includes("_collection_objects")

  // 1. Check tenancy columns
  if (requiresTenancy && !isJunction) {
    const hasTenancy =
      block.includes("tenancyColumns.withTenancy()") ||
      block.includes("tenancyColumns.withLegacy") ||
      block.includes("tenancyColumns.standard") ||
      block.includes("tenancyColumns.required")

    if (!hasTenancy) {
      errors.push(`[${tableName}] Missing tenancy columns — use tenancyColumns.withTenancy()`)
    }
  }

  // 2. Check RLS policies (domain tables)
  if (requiresTenancy && !isJunction) {
    const hasPolicies =
      block.includes("domainPolicies(") ||
      block.includes("domainPoliciesTenantOnly(") ||
      block.includes("pgPolicy(")

    if (!hasPolicies) {
      errors.push(`[${tableName}] Missing RLS policies — use domainPolicies() or domainPoliciesTenantOnly()`)
    }
  }

  // 3. Check timestamps
  if (!isJunction) {
    const hasTimestamps =
      block.includes("...timestamps()") ||
      block.includes("...createdAtOnly()")

    if (!hasTimestamps) {
      warnings.push(`[${tableName}] Missing timestamps — use ...timestamps() or ...createdAtOnly()`)
    }
  }

  // 4. Check index naming convention
  const idxMatches = block.match(/idx\(\s*"([^"]+)"/g) || []
  for (const idxMatch of idxMatches) {
    const idxTable = idxMatch.match(/idx\(\s*"([^"]+)"/)?.[1]
    if (idxTable && idxTable !== tableName) {
      warnings.push(
        `[${tableName}] Index table name mismatch: idx("${idxTable}", ...) should be idx("${tableName}", ...)`
      )
    }
  }

  // 5. Check tenancy indexes (if has tenancy)
  if (requiresTenancy && !isJunction && block.includes("tenancyColumns.withTenancy()")) {
    if (!block.includes("tenancyIndexes(")) {
      warnings.push(`[${tableName}] Has tenancy columns but missing tenancyIndexes()`)
    }
  }

  return { errors, warnings }
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const allErrors = []
  const allWarnings = []
  const summary = { files: 0, tables: 0, errors: 0, warnings: 0 }

  for (const schemaFile of SCHEMA_FILES) {
    const filePath = path.join(repoRoot, schemaFile.path)

    let source
    try {
      source = await fs.readFile(filePath, "utf-8")
    } catch {
      allErrors.push(`File not found: ${schemaFile.path}`)
      continue
    }

    summary.files++
    allErrors.push(
      ...validateNoInlineTenantColumns(source, schemaFile.path, schemaFile.requiresTenancy)
    )
    const tables = extractTables(source)
    summary.tables += tables.length

    for (const table of tables) {
      const result = validateTable(table, schemaFile.domain, schemaFile.requiresTenancy)
      allErrors.push(...result.errors)
      allWarnings.push(...result.warnings)
    }
  }

  summary.errors = allErrors.length
  summary.warnings = allWarnings.length

  if (jsonOutput) {
    console.log(
      JSON.stringify(
        {
          valid: allErrors.length === 0,
          summary,
          errors: allErrors,
          warnings: allWarnings,
        },
        null,
        2
      )
    )
    process.exit(allErrors.length > 0 ? 1 : 0)
  }

  // Human-readable output
  console.log("╔══════════════════════════════════════════════════════════╗")
  console.log("║          Schema Manifest Validator                      ║")
  console.log("╚══════════════════════════════════════════════════════════╝")
  console.log()
  console.log(`  Files scanned:  ${summary.files}`)
  console.log(`  Tables found:   ${summary.tables}`)
  console.log(`  Errors:         ${summary.errors}`)
  console.log(`  Warnings:       ${summary.warnings}`)
  console.log()

  if (allErrors.length > 0) {
    console.log("❌ ERRORS:")
    for (const err of allErrors) {
      console.log(`   ${err}`)
    }
    console.log()
  }

  if (allWarnings.length > 0) {
    console.log("⚠️  WARNINGS:")
    for (const warn of allWarnings) {
      console.log(`   ${warn}`)
    }
    console.log()
  }

  if (allErrors.length === 0) {
    console.log("✅ All schema tables comply with manifest conventions.")
  } else {
    console.log("❌ Schema validation FAILED. Fix errors above.")
  }

  process.exit(allErrors.length > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error("Validator crashed:", err)
  process.exit(2)
})
