# Copilot Instructions — Afenda Monorepo

## Governance Docs

Read `.dev-note/01-AGENT.md` before making changes. It is the anti-drift reference.

## Import Rules

- Import from package barrels only: `@afenda/<domain>`, `@afenda/shared`, `@afenda/shadcn`
- Never reach into package internals (e.g., `@afenda/magictodo/src/server/...`)
- Root `lib/` is **legacy** — all new code in `packages/`

## Tenancy Column Contract

**Never define `legacy_tenant_id`, `organization_id`, or `team_id` inline in `pgTable()` calls.**

Use the tenancy column registry:

```typescript
import { tenancyColumns, tenancyIndexes } from "@afenda/tenancy/drizzle";

export const myTable = pgTable("my_table", {
  id: text("id").primaryKey(),
  ...tenancyColumns.withLegacy(),     // migration period
  // ...tenancyColumns.standard(),    // new tables (no legacy)
  // ...tenancyColumns.required(),    // org required
}, (t) => [
  ...tenancyIndexes("my_table", t),
]);
```

Source of truth: `packages/tenancy/src/drizzle/tenancy-columns.ts`

## API Responses

- Always use envelope helpers: `ok()` / `fail()` from `@afenda/shared/server`
- Orchestra/domain routes may use `kernelOk` / `kernelFail` from `@afenda/orchestra`
- Include `x-request-id` in responses

## Hydration Safety

- Use `Client*` wrappers from `@afenda/shadcn` for Radix primitives (Dialog, Select, Sheet, etc.)
- Never use raw Radix components in app or route UI
- See `.dev-note/HYDRATION-RADIX.md`

## Quality Gates

Before submitting: `pnpm lint && pnpm typecheck && pnpm build`
