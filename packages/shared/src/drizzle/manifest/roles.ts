/**
 * Schema Manifest — Neon Roles
 * 
 * Re-exports of Neon predefined roles + app-defined roles.
 * 
 * @see https://neon.tech/docs/guides/neon-authorize
 * @see https://orm.drizzle.team/docs/neon#neon-authorize
 */

import { pgRole } from "drizzle-orm/pg-core";
import {
  anonymousRole as neonAnonymous,
  authenticatedRole as neonAuthenticated,
} from "drizzle-orm/neon";

/**
 * Neon predefined roles (existing=true)
 */
export const anonymousRole = neonAnonymous;
export const authenticatedRole = neonAuthenticated;

/**
 * App-defined role — for RLS enforcement
 * Must exist in DB (created via migration 0011)
 */
export const appUserRole = pgRole("app_user");
