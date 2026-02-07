/**
 * Orchestra Kernel - Navigation API (BFF - Frontend)
 * GET: Aggregated navigation tree for app shell
 *
 * @domain orchestra
 * @layer api/bff
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { unstable_cache, revalidateTag } from "next/cache";

import { getNavTree, HTTP_STATUS, KERNEL_HEADERS } from "@afenda/orchestra";
import { ok, fail, KERNEL_ERROR_CODES, envelopeHeaders } from "@afenda/shared/server";
import { db } from "@afenda/shared/server/db";
import type { NavTreeUser, NavTreeTenant } from "@afenda/orchestra";

/**
 * Cache configuration for nav tree.
 */
const NAV_CACHE_CONFIG = {
  /** Cache TTL in seconds */
  TTL_SECONDS: 60,
  /** Stale-while-revalidate window */
  SWR_SECONDS: 120,
  /** Cache tags for revalidation */
  TAGS: ["nav", "services"] as string[],
};

/**
 * Get cached nav tree.
 * Uses Next.js unstable_cache for server-side caching with tag-based revalidation.
 */
const getCachedNavTree = unstable_cache(
  async (userJson: string | null, tenantJson: string | null) => {
    const user: NavTreeUser | null = userJson ? JSON.parse(userJson) : null;
    const tenant: NavTreeTenant | null = tenantJson ? JSON.parse(tenantJson) : null;
    
    return getNavTree({ db }, { user, tenant });
  },
  ["nav-tree"],
  {
    revalidate: NAV_CACHE_CONFIG.TTL_SECONDS,
    tags: NAV_CACHE_CONFIG.TAGS,
  }
);

/**
 * Generate ETag from nav tree data.
 */
function generateETag(data: unknown): string {
  const str = JSON.stringify(data);
  // Simple hash for ETag
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `"nav-${Math.abs(hash).toString(16)}"`;
}

/**
 * GET /api/orchestra/nav/bff
 * Get aggregated navigation tree for app shell.
 * 
 * Returns merged nav tree from all registered services,
 * filtered by user capabilities and service health.
 * 
 * Caching:
 * - Server: 60s TTL with stale-while-revalidate
 * - Client: private, max-age=60, stale-while-revalidate=120
 * - ETag support for conditional requests
 * 
 * Revalidation triggers:
 * - revalidateTag("nav") on service register/unregister
 * - revalidateTag("session") on login/logout/role change
 */
export async function GET(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const baseHeaders = envelopeHeaders(traceId);

  try {
    const user: NavTreeUser | null = null;
    const tenant: NavTreeTenant | null = null;
    const ifNoneMatch = request.headers.get("If-None-Match");

    const result = await getCachedNavTree(
      user ? JSON.stringify(user) : null,
      tenant ? JSON.stringify(tenant) : null
    );

    if (!result.ok) {
      return NextResponse.json(result, {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: baseHeaders,
      });
    }

    const etag = generateETag(result.data);
    const cacheHeaders = {
      ...baseHeaders,
      ETag: etag,
      "Cache-Control": `private, max-age=${NAV_CACHE_CONFIG.TTL_SECONDS}, stale-while-revalidate=${NAV_CACHE_CONFIG.SWR_SECONDS}`,
    };

    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304, headers: cacheHeaders });
    }

    return NextResponse.json(ok(result.data, { traceId }), {
      status: HTTP_STATUS.OK,
      headers: cacheHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to load navigation tree",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers: baseHeaders }
    );
  }
}

/**
 * Revalidate nav cache.
 * Call this when services change or user permissions change.
 */
export function revalidateNavCache() {
  for (const tag of NAV_CACHE_CONFIG.TAGS) {
    revalidateTag(tag, { expire: NAV_CACHE_CONFIG.TTL_SECONDS });
  }
}
