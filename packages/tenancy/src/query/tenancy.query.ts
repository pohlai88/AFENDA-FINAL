/**
 * @domain tenancy
 * @layer query
 * @responsibility TanStack Query hooks for tenancy domain
 */

"use client";

import type { UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { routes } from "@afenda/shared/constants";
import { TENANCY_QUERY_KEYS } from "./tenancy.query-keys";
import type {
  TenancyOrganizationResponse,
  TenancyOrganizationListResponse,
  TenancyTeamListItem,
  TenancyTeamListResponse,
  TenancyMembershipListResponse,
} from "../zod";

/** Partial query options for overriding defaults (queryKey/queryFn provided by hook) */
type QueryOverrides<T> = Partial<Omit<UseQueryOptions<T>, "queryKey" | "queryFn">>;

const api = routes.api.tenancy;

/**
 * Envelope response parser - extracts data from { ok: true, data } or { ok: false, error }
 */
function parseEnvelope<T>(response: { ok: boolean; data?: T; error?: { message: string } }): T {
  if (!response.ok || !response.data) {
    throw new Error(response.error?.message || "Request failed");
  }
  return response.data;
}

/**
 * Build search params from object
 */
function buildSearchParams(params?: Record<string, unknown>): URLSearchParams {
  const searchParams = new URLSearchParams();
  if (!params) return searchParams;

  Object.entries(params).forEach(([key, value]) => {
    if (value == null) return;
    if (Array.isArray(value)) {
      searchParams.set(key, value.join(","));
      return;
    }
    searchParams.set(key, String(value));
  });

  return searchParams;
}

// ============================================================================
// ORGANIZATIONS
// ============================================================================

export type OrganizationsListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

/**
 * Fetch organizations list with caching.
 * Stale time: 2 minutes (organizations change infrequently)
 */
export function useOrganizationsQuery(
  params?: OrganizationsListParams,
  options?: QueryOverrides<TenancyOrganizationListResponse>
) {
  return useQuery({
    queryKey: TENANCY_QUERY_KEYS.organizations.list(params),
    queryFn: async () => {
      const searchParams = buildSearchParams(params);
      const url = searchParams.toString()
        ? `${api.organizations.bff.list()}?${searchParams.toString()}`
        : api.organizations.bff.list();
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch organizations");
      const payload = await response.json();
      return parseEnvelope<TenancyOrganizationListResponse>(payload);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Fetch single organization by ID
 * Stale time: 2 minutes
 */
export function useOrganizationQuery(
  id: string,
  options?: QueryOverrides<TenancyOrganizationResponse>
) {
  return useQuery({
    queryKey: TENANCY_QUERY_KEYS.organizations.byId(id),
    queryFn: async () => {
      const response = await fetch(api.organizations.bff.byId(id));
      if (!response.ok) throw new Error("Failed to fetch organization");
      const payload = await response.json();
      return parseEnvelope<TenancyOrganizationResponse>(payload);
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

// ============================================================================
// TEAMS
// ============================================================================

export type TeamsListParams = {
  page?: number;
  limit?: number;
  search?: string;
  organizationId?: string;
};

/**
 * Fetch teams list with caching.
 * Stale time: 1 minute (teams are actively managed)
 */
export function useTeamsQuery(
  params?: TeamsListParams,
  options?: QueryOverrides<TenancyTeamListResponse>
) {
  return useQuery({
    queryKey: TENANCY_QUERY_KEYS.teams.list(params),
    queryFn: async () => {
      const searchParams = buildSearchParams(params);
      const url = searchParams.toString()
        ? `${api.teams.bff.list()}?${searchParams.toString()}`
        : api.teams.bff.list();
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch teams");
      const payload = await response.json();
      return parseEnvelope<TenancyTeamListResponse>(payload);
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Fetch single team by ID
 * Stale time: 1 minute
 * Note: Returns TenancyTeamListItem which includes optional orgName from join
 */
export function useTeamQuery(
  id: string,
  options?: QueryOverrides<TenancyTeamListItem>
) {
  return useQuery({
    queryKey: TENANCY_QUERY_KEYS.teams.byId(id),
    queryFn: async () => {
      const response = await fetch(api.teams.bff.byId(id));
      if (!response.ok) throw new Error("Failed to fetch team");
      const payload = await response.json();
      return parseEnvelope<TenancyTeamListItem>(payload);
    },
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

// ============================================================================
// MEMBERSHIPS
// ============================================================================

export type MembershipsListParams = {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
};

/**
 * Fetch memberships list with caching.
 * Stale time: 1 minute (memberships are actively managed)
 */
export function useMembershipsQuery(
  params?: MembershipsListParams,
  options?: QueryOverrides<TenancyMembershipListResponse>
) {
  return useQuery({
    queryKey: TENANCY_QUERY_KEYS.memberships.list(params),
    queryFn: async () => {
      const searchParams = buildSearchParams(params);
      const url = searchParams.toString()
        ? `${api.memberships.bff.list()}?${searchParams.toString()}`
        : api.memberships.bff.list();
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch memberships");
      const payload = await response.json();
      return parseEnvelope<TenancyMembershipListResponse>(payload);
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

type MutationOverrides<TData, TVariables> = Partial<
  Omit<UseMutationOptions<TData, Error, TVariables>, "mutationFn">
>;

// --- Organization Mutations ---

export type UpdateOrganizationInput = {
  id: string;
  name?: string;
  slug?: string;
  description?: string | null;
  logo?: string | null;
  settings?: Record<string, unknown>;
};

export function useUpdateOrganizationMutation(
  options?: MutationOverrides<TenancyOrganizationResponse, UpdateOrganizationInput>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: UpdateOrganizationInput) => {
      const response = await fetch(api.organizations.bff.byId(input.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      
      if (!response.ok) throw new Error("Failed to update organization");
      const payload = await response.json();
      return parseEnvelope<TenancyOrganizationResponse>(payload);
    },
    onSuccess: (data, variables) => {
      // Invalidate organization queries
      queryClient.invalidateQueries({ 
        queryKey: TENANCY_QUERY_KEYS.organizations.byId(variables.id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: TENANCY_QUERY_KEYS.organizations.lists() 
      });
    },
    ...options,
  });
}

export function useDeleteOrganizationMutation(
  options?: MutationOverrides<{ success: boolean }, string>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(api.organizations.bff.byId(id), {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error("Failed to delete organization");
      const payload = await response.json();
      return parseEnvelope<{ success: boolean }>(payload);
    },
    onSuccess: () => {
      // Invalidate all organization queries
      queryClient.invalidateQueries({ 
        queryKey: TENANCY_QUERY_KEYS.organizations.all() 
      });
    },
    ...options,
  });
}

// --- Team Mutations ---

export type UpdateTeamInput = {
  id: string;
  name?: string;
  description?: string | null;
  parentId?: string | null;
  settings?: Record<string, unknown>;
};

export function useUpdateTeamMutation(
  options?: MutationOverrides<TenancyTeamListItem, UpdateTeamInput>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: UpdateTeamInput) => {
      const response = await fetch(api.teams.bff.byId(input.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      
      if (!response.ok) throw new Error("Failed to update team");
      const payload = await response.json();
      return parseEnvelope<TenancyTeamListItem>(payload);
    },
    onSuccess: (data, variables) => {
      // Invalidate team queries
      queryClient.invalidateQueries({ 
        queryKey: TENANCY_QUERY_KEYS.teams.byId(variables.id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: TENANCY_QUERY_KEYS.teams.lists() 
      });
    },
    ...options,
  });
}

export function useDeleteTeamMutation(
  options?: MutationOverrides<{ success: boolean }, string>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(api.teams.bff.byId(id), {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error("Failed to delete team");
      const payload = await response.json();
      return parseEnvelope<{ success: boolean }>(payload);
    },
    onSuccess: () => {
      // Invalidate all team queries
      queryClient.invalidateQueries({ 
        queryKey: TENANCY_QUERY_KEYS.teams.all() 
      });
    },
    ...options,
  });
}

// --- Organization Member Mutations ---

export type OrgMemberListResponse = {
  members: Array<{
    id: string;
    userId: string;
    role: string;
    permissions: Record<string, boolean>;
    invitedBy: string | null;
    joinedAt: string;
  }>;
};

export type AddOrgMemberInput = {
  organizationId: string;
  userId: string;
  role: "owner" | "admin" | "member";
};

export type UpdateMemberRoleInput = {
  organizationId: string;
  userId: string;
  role: "owner" | "admin" | "member";
};

export type RemoveMemberInput = {
  organizationId: string;
  userId: string;
};

export function useOrgMembersQuery(
  organizationId: string,
  options?: QueryOverrides<OrgMemberListResponse>
) {
  return useQuery({
    queryKey: [...TENANCY_QUERY_KEYS.organizations.byId(organizationId), "members"],
    queryFn: async () => {
      const response = await fetch(
        `${api.organizations.bff.byId(organizationId)}/members/bff`
      );
      if (!response.ok) throw new Error("Failed to fetch organization members");
      const payload = await response.json();
      return parseEnvelope<OrgMemberListResponse>(payload);
    },
    enabled: !!organizationId,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

export function useAddOrgMemberMutation(
  options?: MutationOverrides<unknown, AddOrgMemberInput>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: AddOrgMemberInput) => {
      const response = await fetch(
        `${api.organizations.bff.byId(input.organizationId)}/members/bff`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: input.userId, role: input.role }),
        }
      );
      
      if (!response.ok) throw new Error("Failed to add member");
      const payload = await response.json();
      return parseEnvelope(payload);
    },
    onSuccess: (data, variables) => {
      // Invalidate member queries
      queryClient.invalidateQueries({ 
        queryKey: [...TENANCY_QUERY_KEYS.organizations.byId(variables.organizationId), "members"]
      });
    },
    ...options,
  });
}

export function useUpdateMemberRoleMutation(
  options?: MutationOverrides<unknown, UpdateMemberRoleInput>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: UpdateMemberRoleInput) => {
      const response = await fetch(
        `${api.organizations.bff.byId(input.organizationId)}/members/${input.userId}/bff`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: input.role }),
        }
      );
      
      if (!response.ok) throw new Error("Failed to update member role");
      const payload = await response.json();
      return parseEnvelope(payload);
    },
    onSuccess: (data, variables) => {
      // Invalidate member queries
      queryClient.invalidateQueries({ 
        queryKey: [...TENANCY_QUERY_KEYS.organizations.byId(variables.organizationId), "members"]
      });
    },
    ...options,
  });
}

export function useRemoveMemberMutation(
  options?: MutationOverrides<unknown, RemoveMemberInput>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: RemoveMemberInput) => {
      const response = await fetch(
        `${api.organizations.bff.byId(input.organizationId)}/members/${input.userId}/bff`,
        {
          method: "DELETE",
        }
      );
      
      if (!response.ok) throw new Error("Failed to remove member");
      const payload = await response.json();
      return parseEnvelope(payload);
    },
    onSuccess: (data, variables) => {
      // Invalidate member queries
      queryClient.invalidateQueries({ 
        queryKey: [...TENANCY_QUERY_KEYS.organizations.byId(variables.organizationId), "members"]
      });
    },
    ...options,
  });
}

// --- Design System Mutations ---

export type DesignSystemResponse = {
  designSystem: {
    tenantId: string;
    settings: {
      style?: string;
      baseColor?: string;
      brandColor?: string;
      theme?: string;
      menuColor?: string;
      menuAccent?: string;
      menuColorLight?: string;
      menuColorDark?: string;
      menuAccentLight?: string;
      menuAccentDark?: string;
      font?: string;
      radius?: number;
    };
    createdAt: string;
    updatedAt: string;
  };
};

export type UpdateDesignSystemInput = {
  style?: string;
  baseColor?: string;
  brandColor?: string;
  theme?: string;
  menuColor?: string;
  menuAccent?: string;
  menuColorLight?: string;
  menuColorDark?: string;
  menuAccentLight?: string;
  menuAccentDark?: string;
  font?: string;
  radius?: number;
};

export function useDesignSystemQuery(
  options?: QueryOverrides<DesignSystemResponse>
) {
  return useQuery({
    queryKey: [...TENANCY_QUERY_KEYS.all, "design-system"],
    queryFn: async () => {
      const response = await fetch(`${api.bff()}/tenant/design-system/bff`);
      if (!response.ok) throw new Error("Failed to fetch design system");
      const payload = await response.json();
      return parseEnvelope<DesignSystemResponse>(payload);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
}

export function useUpdateDesignSystemMutation(
  options?: MutationOverrides<DesignSystemResponse, UpdateDesignSystemInput>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: UpdateDesignSystemInput) => {
      const response = await fetch(`${api.bff()}/tenant/design-system/bff`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      
      if (!response.ok) throw new Error("Failed to update design system");
      const payload = await response.json();
      return parseEnvelope<DesignSystemResponse>(payload);
    },
    onSuccess: () => {
      // Invalidate design system query
      queryClient.invalidateQueries({ 
        queryKey: [...TENANCY_QUERY_KEYS.all, "design-system"]
      });
    },
    ...options,
  });
}

// ============================================================================
// INVITATIONS
// ============================================================================

export type InvitationListResponse = {
  invitations: Array<{
    id: string;
    email: string;
    organizationId: string | null;
    teamId: string | null;
    role: string;
    invitedBy: string;
    message: string | null;
    status: string;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
    orgName?: string | null;
    teamName?: string | null;
  }>;
};

export type CreateOrgInvitationInput = {
  organizationId: string;
  email: string;
  role: "owner" | "admin" | "member";
  message?: string;
};

export type CancelInvitationInput = {
  organizationId: string;
  invitationId: string;
};

export type InvitationDetails = {
  invitation: {
    id: string;
    email: string;
    organizationId: string | null;
    teamId: string | null;
    role: string;
    message: string | null;
    status: string;
    expiresAt: string;
    createdAt: string;
    orgName: string | null;
    orgSlug: string | null;
    teamName: string | null;
    isExpired?: boolean;
  };
};

/**
 * Fetch pending invitations for an organization
 * Stale time: 1 minute
 */
export function useOrgInvitationsQuery(
  organizationId: string,
  options?: QueryOverrides<InvitationListResponse>
) {
  return useQuery({
    queryKey: TENANCY_QUERY_KEYS.invitations.byOrg(organizationId),
    queryFn: async () => {
      const response = await fetch(
        `${api.organizations.bff.byId(organizationId)}/invitations/bff`
      );
      if (!response.ok) throw new Error("Failed to fetch invitations");
      const payload = await response.json();
      return parseEnvelope<InvitationListResponse>(payload);
    },
    enabled: !!organizationId,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Fetch invitation details by token (for acceptance page)
 */
export function useInvitationDetailsQuery(
  token: string,
  options?: QueryOverrides<InvitationDetails>
) {
  return useQuery({
    queryKey: TENANCY_QUERY_KEYS.invitations.byToken(token),
    queryFn: async () => {
      const response = await fetch(api.invitations.bff.accept(token));
      if (!response.ok) throw new Error("Failed to fetch invitation");
      const payload = await response.json();
      return parseEnvelope<InvitationDetails>(payload);
    },
    enabled: !!token,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
}

/**
 * Create organization invitation mutation
 */
export function useCreateOrgInvitationMutation(
  options?: MutationOverrides<unknown, CreateOrgInvitationInput>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateOrgInvitationInput) => {
      const response = await fetch(
        `${api.organizations.bff.byId(input.organizationId)}/invitations/bff`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: input.email,
            role: input.role,
            message: input.message,
          }),
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to send invitation");
      }
      const payload = await response.json();
      return parseEnvelope(payload);
    },
    onSuccess: (data, variables) => {
      // Invalidate invitations list for this org
      queryClient.invalidateQueries({ 
        queryKey: TENANCY_QUERY_KEYS.invitations.byOrg(variables.organizationId)
      });
    },
    ...options,
  });
}

/**
 * Cancel invitation mutation
 */
export function useCancelInvitationMutation(
  options?: MutationOverrides<unknown, CancelInvitationInput>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CancelInvitationInput) => {
      const response = await fetch(
        `${api.organizations.bff.byId(input.organizationId)}/invitations/${input.invitationId}/bff`,
        {
          method: "DELETE",
        }
      );
      
      if (!response.ok) throw new Error("Failed to cancel invitation");
      const payload = await response.json();
      return parseEnvelope(payload);
    },
    onSuccess: (data, variables) => {
      // Invalidate invitations list
      queryClient.invalidateQueries({ 
        queryKey: TENANCY_QUERY_KEYS.invitations.byOrg(variables.organizationId)
      });
    },
    ...options,
  });
}

/**
 * Accept invitation mutation
 */
export function useAcceptInvitationMutation(
  options?: MutationOverrides<unknown, { token: string }>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: { token: string }) => {
      const response = await fetch(
        api.invitations.bff.accept(input.token),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to accept invitation");
      }
      const payload = await response.json();
      return parseEnvelope(payload);
    },
    onSuccess: () => {
      // Invalidate all tenancy queries (user now has new memberships)
      queryClient.invalidateQueries({ 
        queryKey: TENANCY_QUERY_KEYS.all
      });
    },
    ...options,
  });
}
