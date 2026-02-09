/**
 * Neon Auth API route handler.
 * Proxies auth requests to Neon Auth (sign-in, sign-up, OAuth, etc.).
 *
 * @domain auth
 * @layer app/api
 * @see https://neon.com/docs/auth/quick-start/nextjs
 */

import "server-only";

import { auth } from "@afenda/auth/server";

export const { GET, POST } = auth.handler();
