/**
 * Neon Auth server instance for Next.js.
 * Uses Zod-validated env; provides handler, middleware, getSession, etc.
 *
 * @layer auth/server
 */

import "server-only";
import { createNeonAuth } from "@neondatabase/auth/next/server";
import { authEnv } from "../constant/auth-env";

export const auth = createNeonAuth({
  baseUrl: authEnv.NEON_AUTH_BASE_URL,
  cookies: { secret: authEnv.NEON_AUTH_COOKIE_SECRET },
});
