/**
 * Neon Auth client for browser-side auth operations.
 * Used by NeonAuthUIProvider and client components.
 *
 * @layer auth/client
 */

"use client";

import { createAuthClient } from "@neondatabase/auth/next";

export const authClient = createAuthClient();
