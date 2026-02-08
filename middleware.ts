/**
 * Route protection middleware (first line of defense).
 * Redirects unauthenticated users to login.
 * 
 * Phase 4, Step 4.4: Enhanced to inject tenant context headers
 * Reads active tenant from cookies and adds to request headers
 *
 * @see CVE-2025-29927: Use layout-level auth guard as second line.
 */

import { auth } from "@afenda/auth/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Custom middleware that:
 * 1. Checks authentication via Neon Auth
 * 2. Injects tenant context headers from cookies
 */
export async function middleware(request: NextRequest) {
  // Get auth session
  const { data: session } = await auth.getSession();
  
  // If not authenticated and not on auth/public route, redirect to login
  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/auth/");
  const isPublicRoute = pathname === "/" || pathname.startsWith("/public");
  
  if (!session?.user && !isAuthRoute && !isPublicRoute) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  // Get tenant IDs from cookies
  const activeTenantOrgId = request.cookies.get("activeTenantOrgId")?.value;
  const activeTenantTeamId = request.cookies.get("activeTenantTeamId")?.value;

  // If tenant cookies exist, inject headers for tenant context
  if (activeTenantOrgId || activeTenantTeamId) {
    const requestHeaders = new Headers(request.headers);
    
    if (activeTenantOrgId) {
      requestHeaders.set("x-tenant-org-id", activeTenantOrgId);
    }
    
    if (activeTenantTeamId) {
      requestHeaders.set("x-tenant-team-id", activeTenantTeamId);
    }

    // Return response with modified headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // No tenant context, proceed normally
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/app/:path*",
    "/dashboard/:path*",
    "/magicdrive/:path*",
    "/magictodo/:path*",
    "/tenancy/:path*",
    "/admin/:path*",
    "/settings/:path*",
    "/api/:path*", // Include API routes for tenant header injection
  ],
};
