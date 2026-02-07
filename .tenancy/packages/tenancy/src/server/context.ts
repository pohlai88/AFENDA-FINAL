import "@afenda/shared/server/only"

import { cookies, headers } from "next/headers"

import { HEADER_NAMES, COOKIE_NAMES } from "@afenda/shared/constants"
import { getServerEnv } from "@afenda/shared/env"
import { inferTenantFromHost } from "@afenda/shared/utils"

export type TenantContext = {
  tenantId: string | null
}

// Resolve tenant from request headers/cookies. (Auth integration may override this later.)
export async function getTenantContext(): Promise<TenantContext> {
  const h = await headers()
  const fromHeader = h.get(HEADER_NAMES.TENANT_ID)
  if (fromHeader) return { tenantId: fromHeader }

  // Keep in sync with middleware cookie name.
  const c = await cookies()
  const fromCookie = c.get(COOKIE_NAMES.TENANT_ID)?.value
  if (fromCookie) return { tenantId: fromCookie }

  // Infer from host for API routes too (Proxy does not run on /api by default).
  const env = getServerEnv()
  const inferred = inferTenantFromHost(h.get("x-forwarded-host") ?? h.get("host"), {
    // These vars are safe to read directly; they're also used by Proxy (Edge).
    baseUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
    publicSubdomains: (process.env.NEXT_PUBLIC_PUBLIC_SUBDOMAINS ?? "www,app,api,admin,docs,blog,status,cdn")
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean),
    pattern:
      process.env.NEXT_PUBLIC_TENANT_SUBDOMAIN_PATTERN ??
      "^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$",
  })
  if (inferred) return { tenantId: inferred }

  // Dev-only fallback so the app can run without tenant bootstrapping.
  if (env.NODE_ENV !== "production") {
    return { tenantId: env.DEV_TENANT_ID ?? "dev-tenant" }
  }

  return { tenantId: null }
}

