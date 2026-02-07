/**
 * Type-safe environment validation for Neon Auth.
 * Fails fast with clear error if required vars are missing.
 *
 * @layer auth/constant
 */

import { z } from "zod";

const authEnvSchema = z.object({
  NEON_AUTH_BASE_URL: z
    .string()
    .url()
    .describe("Neon Auth base URL from MCP provisioning or Neon Console"),
  NEON_AUTH_COOKIE_SECRET: z
    .string()
    .min(32)
    .describe("Cookie secret for session management (min 32 chars)"),
  NEXT_PUBLIC_NEON_AUTH_URL: z.string().url().optional(),
});

export type AuthEnv = z.infer<typeof authEnvSchema>;

function loadAuthEnv(): AuthEnv {
  const raw = {
    NEON_AUTH_BASE_URL: process.env.NEON_AUTH_BASE_URL,
    NEON_AUTH_COOKIE_SECRET: process.env.NEON_AUTH_COOKIE_SECRET,
    NEXT_PUBLIC_NEON_AUTH_URL: process.env.NEXT_PUBLIC_NEON_AUTH_URL ?? process.env.NEON_AUTH_BASE_URL,
  };

  const result = authEnvSchema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `[@afenda/auth] Invalid auth environment. Required: NEON_AUTH_BASE_URL, NEON_AUTH_COOKIE_SECRET.\n${issues}`
    );
  }

  return result.data;
}

export const authEnv = loadAuthEnv();
