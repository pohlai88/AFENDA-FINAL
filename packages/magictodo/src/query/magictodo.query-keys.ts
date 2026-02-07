/**
 * magictodo domain query keys for TanStack Query.
 * Centralized query key factory for cache invalidation and prefetching.
 */

export const MAGICTODO_QUERY_KEYS = {
  all: ["magictodo"] as const,
  lists: () => [...MAGICTODO_QUERY_KEYS.all, "list"] as const,
  list: (params?: { page?: number; limit?: number }) => 
    [...MAGICTODO_QUERY_KEYS.lists(), params] as const,
  details: () => [...MAGICTODO_QUERY_KEYS.all, "detail"] as const,
  byId: (id: string) => [...MAGICTODO_QUERY_KEYS.details(), id] as const,
};
