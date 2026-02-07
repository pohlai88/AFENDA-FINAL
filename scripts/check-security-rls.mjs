#!/usr/bin/env node
import envPkg from "@next/env"
import postgres from "postgres"

envPkg.loadEnvConfig(process.cwd())

const useRuntime = process.argv.includes("--runtime")
const url = useRuntime ? process.env.DATABASE_URL : (process.env.DATABASE_URL_MIGRATIONS ?? process.env.DATABASE_URL)
if (!url) {
  console.error("Missing DATABASE_URL (or DATABASE_URL_MIGRATIONS)")
  process.exit(1)
}

const sql = postgres(url, { max: 1, prepare: false })

try {
  const roleRows = await sql.unsafe("select current_user as role, current_setting('row_security', true) as row_security")
  console.log("role:", roleRows?.[0])

  const polRows = await sql.unsafe(
    "select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check " +
    "from pg_policies " +
    "where schemaname = 'public' and tablename in ('neon_login_attempts','neon_unlock_tokens') " +
    "order by tablename, policyname"
  )
  console.log("policies:", polRows)

  const tblRows = await sql.unsafe(
    "select relname as table, relrowsecurity as rls_enabled, relforcerowsecurity as rls_forced " +
    "from pg_class c join pg_namespace n on n.oid = c.relnamespace " +
    "where n.nspname='public' and c.relname in ('neon_login_attempts','neon_unlock_tokens')"
  )
  console.log("tables:", tblRows)
} finally {
  await sql.end({ timeout: 5 })
}

