/**
 * @domain tenancy
 * @layer constant
 * @responsibility Tenancy domain constants
 */

export const TENANCY_ORGANIZATION = {
  MAX_NAME_LENGTH: 255,
  MAX_SLUG_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
  DEFAULT_ROLE: "member" as const,
} as const;

export const TENANCY_TEAM = {
  MAX_NAME_LENGTH: 255,
  MAX_SLUG_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
} as const;

/** Individual is canonical: userId from auth = individual; no separate individuals table */
export const TENANCY_INDIVIDUAL = {
  INDIVIDUAL_CANONICAL: true,
} as const;

export const TENANCY_CORE = {
  MIN_TEAM_MEMBERS: 2,
  MIN_ORG_MEMBERS: 2,
  ROLES: {
    ORG: ["owner", "admin", "member"] as const,
    TEAM: ["lead", "member"] as const,
  },
} as const;

export const TENANCY_CONSTANTS = {
  ORGANIZATION: TENANCY_ORGANIZATION,
  TEAM: TENANCY_TEAM,
  INDIVIDUAL: TENANCY_INDIVIDUAL,
  CORE: TENANCY_CORE,
} as const;
