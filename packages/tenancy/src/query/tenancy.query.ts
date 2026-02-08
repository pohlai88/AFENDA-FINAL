/**
 * @domain tenancy
 * @layer query
 * @responsibility TanStack Query hooks for tenancy domain
 */

"use client";

import type { UseQueryOptions } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
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
