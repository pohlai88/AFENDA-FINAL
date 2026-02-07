/**
 * Route protection middleware (first line of defense).
 * Redirects unauthenticated users to login.
 *
 * @see CVE-2025-29927: Use layout-level auth guard as second line.
 */

import { auth } from "@afenda/auth/server";

export default auth.middleware({
  loginUrl: "/auth/sign-in",
});

export const config = {
  matcher: [
    "/app/:path*",
    "/dashboard/:path*",
    "/magicdrive/:path*",
    "/magictodo/:path*",
    "/tenancy/:path*",
    "/admin/:path*",
    "/settings/:path*",
  ],
};
