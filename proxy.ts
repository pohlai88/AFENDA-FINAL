/**
 * Proxy (Next.js 16): runs before request completion.
 * Replaces deprecated middleware.ts — same behavior, clearer naming.
 *
 * 1. Auth check via Neon Auth (redirect unauthenticated to sign-in).
 * 2. Injects tenant context headers from cookies for downstream routes.
 *
 * @see CVE-2025-29927: Layout-level auth guard remains second line of defense.
 */

import { auth } from "@afenda/auth/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Proxy: auth redirect + tenant header injection.
 * Runs only on matched paths (see config.matcher).
 */
export async function proxy(request: NextRequest) {
  const { data: session } = await auth.getSession();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/auth/");
  const isAuthApiRoute = pathname.startsWith("/api/auth/");
  const isPublicRoute = pathname === "/" || pathname.startsWith("/public");

  if (!session?.user && !isAuthRoute && !isAuthApiRoute && !isPublicRoute) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  const activeTenantOrgId = request.cookies.get("activeTenantOrgId")?.value;
  const activeTenantTeamId = request.cookies.get("activeTenantTeamId")?.value;

  if (activeTenantOrgId || activeTenantTeamId) {
    const requestHeaders = new Headers(request.headers);
    if (activeTenantOrgId) requestHeaders.set("x-tenant-org-id", activeTenantOrgId);
    if (activeTenantTeamId) requestHeaders.set("x-tenant-team-id", activeTenantTeamId);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next();
}

// Run only on app/API routes — static assets are never matched.
export const config = {
  matcher: [
    "/app/:path*",
    "/dashboard/:path*",
    "/magicdrive/:path*",
    "/magictodo/:path*",
    "/tenancy/:path*",
    "/admin/:path*",
    "/settings/:path*",
    "/api/:path*",
  ],
};
