import { pgRole } from "drizzle-orm/pg-core";
import { anonymousRole as neonAnonymous, authenticatedRole as neonAuthenticated } from "drizzle-orm/neon";

/**
 * Neon-first roles.
 *
 * Neon exposes predefined roles and marks them as existing:
 * - authenticated
 * - anonymous
 *
 * You can also define app-specific roles; drizzle-kit can manage roles if enabled.
 */

// Re-export Neon predefined roles (existing)
export const anonymousRole = neonAnonymous;
export const authenticatedRole = neonAuthenticated;

// App-defined role example (not existing by default)
export const adminRole = pgRole("admin");
