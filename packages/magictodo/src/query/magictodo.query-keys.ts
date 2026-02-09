/**
 * magictodo domain query keys for TanStack Query.
 * Centralized query key factory for cache invalidation and prefetching.
 * ALL query hooks MUST use these keys — never inline array literals.
 */

export const MAGICTODO_QUERY_KEYS = {
  all: ["magictodo"] as const,

  // Tasks
  lists: () => [...MAGICTODO_QUERY_KEYS.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...MAGICTODO_QUERY_KEYS.lists(), params] as const,
  details: () => [...MAGICTODO_QUERY_KEYS.all, "detail"] as const,
  byId: (id: string) => [...MAGICTODO_QUERY_KEYS.details(), id] as const,

  // Projects
  projects: () => [...MAGICTODO_QUERY_KEYS.all, "projects"] as const,

  // Focus
  focus: {
    all: () => [...MAGICTODO_QUERY_KEYS.all, "focus"] as const,
    session: () => [...MAGICTODO_QUERY_KEYS.all, "focus", "session"] as const,
    streak: () => [...MAGICTODO_QUERY_KEYS.all, "focus", "streak"] as const,
    stats: (period?: string) =>
      [...MAGICTODO_QUERY_KEYS.all, "focus", "stats", period] as const,
  },

  // Snoozed
  snoozed: () => [...MAGICTODO_QUERY_KEYS.all, "snoozed"] as const,
};
