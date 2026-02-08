/**
 * @domain tenancy
 * @layer query
 * @responsibility Query keys factory for TanStack Query cache management
 */

/**
 * Centralized query key factory for tenancy domain.
 * Follows hierarchical structure for granular cache invalidation.
 * 
 * @example
 * // Invalidate all tenancy queries
 * queryClient.invalidateQueries({ queryKey: TENANCY_QUERY_KEYS.all })
 * 
 * // Invalidate specific organization
 * queryClient.invalidateQueries({ queryKey: TENANCY_QUERY_KEYS.organizations.byId(orgId) })
 */
export const TENANCY_QUERY_KEYS = {
  all: ["tenancy"] as const,

  // Organizations
  organizations: {
    all: () => [...TENANCY_QUERY_KEYS.all, "organizations"] as const,
    lists: () => [...TENANCY_QUERY_KEYS.organizations.all(), "list"] as const,
    list: (params?: { page?: number; limit?: number; search?: string }) =>
      [...TENANCY_QUERY_KEYS.organizations.lists(), params] as const,
    details: () => [...TENANCY_QUERY_KEYS.organizations.all(), "detail"] as const,
    byId: (id: string) => [...TENANCY_QUERY_KEYS.organizations.details(), id] as const,
  },

  // Teams
  teams: {
    all: () => [...TENANCY_QUERY_KEYS.all, "teams"] as const,
    lists: () => [...TENANCY_QUERY_KEYS.teams.all(), "list"] as const,
    list: (params?: { 
      page?: number; 
      limit?: number; 
      search?: string; 
      organizationId?: string 
    }) => [...TENANCY_QUERY_KEYS.teams.lists(), params] as const,
    details: () => [...TENANCY_QUERY_KEYS.teams.all(), "detail"] as const,
    byId: (id: string) => [...TENANCY_QUERY_KEYS.teams.details(), id] as const,
  },

  // Memberships
  memberships: {
    all: () => [...TENANCY_QUERY_KEYS.all, "memberships"] as const,
    lists: () => [...TENANCY_QUERY_KEYS.memberships.all(), "list"] as const,
    list: (params?: { 
      page?: number; 
      limit?: number; 
      search?: string; 
      role?: string 
    }) => [...TENANCY_QUERY_KEYS.memberships.lists(), params] as const,
    details: () => [...TENANCY_QUERY_KEYS.memberships.all(), "detail"] as const,
    byId: (id: string) => [...TENANCY_QUERY_KEYS.memberships.details(), id] as const,
  },

  // Invitations
  invitations: {
    all: () => [...TENANCY_QUERY_KEYS.all, "invitations"] as const,
    lists: () => [...TENANCY_QUERY_KEYS.invitations.all(), "list"] as const,
    byOrg: (organizationId: string) => 
      [...TENANCY_QUERY_KEYS.invitations.lists(), "org", organizationId] as const,
    byTeam: (teamId: string) => 
      [...TENANCY_QUERY_KEYS.invitations.lists(), "team", teamId] as const,
    details: () => [...TENANCY_QUERY_KEYS.invitations.all(), "detail"] as const,
    byToken: (token: string) => [...TENANCY_QUERY_KEYS.invitations.details(), token] as const,
  },
} as const;
