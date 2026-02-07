/**
 * Neon Auth API route handler.
 * Proxies auth requests to Neon Auth (sign-in, sign-up, OAuth, etc.).
 *
 * @layer app/api
 * @see https://neon.com/docs/auth/quick-start/nextjs
 */

import { auth } from "@afenda/auth/server";

export const { GET, POST } = auth.handler();
