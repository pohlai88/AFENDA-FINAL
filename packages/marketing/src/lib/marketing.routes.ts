/* eslint-disable no-restricted-syntax -- This IS the route definitions source */
/**
 * Marketing domain routes.
 * Embedded per-domain to avoid cross-domain dependencies.
 * Only includes routes relevant to Marketing domain.
 */

export const marketingRoutes = {
  ui: {
    // Marketing owns public-facing pages
    home: () => "/",
    about: () => "/about",
    contact: () => "/contact",
    terms: () => "/terms",
    privacy: () => "/privacy",
    security: () => "/security",
    infrastructure: () => "/infrastructure",
    pdpa: () => "/pdpa",
    docs: () => "/docs",
    apiDocs: () => "/api-docs",
    status: () => "/status",
    offline: () => "/offline",
  },
  /**
   * External routes that marketing pages link to.
   * These are owned by other domains but marketing needs to reference them.
   */
  external: {
    auth: {
      login: () => "/login",
      register: () => "/register",
    },
    orchestra: {
      /** App entry: dashboard (middleware redirects to /auth/sign-in if unauthenticated) */
      root: () => "/dashboard",
    },
  },
  api: {
    bff: "/api/bff/marketing",
    v1: "/api/v1/marketing",
    ops: "/api/ops/marketing",
  },
} as const;
