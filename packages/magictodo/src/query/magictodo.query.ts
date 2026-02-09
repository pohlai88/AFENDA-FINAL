"use client";

import type { UseQueryOptions } from "@tanstack/react-query";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/** Partial query options for overriding defaults (queryKey/queryFn provided by hook) */
type QueryOverrides<T> = Partial<Omit<UseQueryOptions<T>, "queryKey" | "queryFn">>;
import { routes } from "@afenda/shared/constants";
import { MAGICTODO_QUERY_KEYS } from "./magictodo.query-keys";
import type {
  TaskResponse,
  ProjectResponse,
  FocusSession,
  DailyFocusStats,
} from "@afenda/magictodo/zod";

type FocusSessionData = FocusSession | null;
type DailyFocusStatsData = DailyFocusStats | null;

const api = routes.api.magictodo.bff;

type TaskListParams = Record<string, unknown> & {
  status?: string | { values: string[]; includeMode?: "any" | "all" };
  priority?: string;
  projectId?: string;
  limit?: number;
  offset?: number;
};

type TaskListResponse = {
  items: TaskResponse[];
  total?: number;
  limit?: number;
  offset?: number;
};

type ProjectListResponse = {
  items: ProjectResponse[];
  total?: number;
};

function buildSearchParams(params?: TaskListParams) {
  const searchParams = new URLSearchParams();
  if (!params) return searchParams;

  Object.entries(params).forEach(([key, value]) => {
    if (value == null) return;
    if (key === "status" && typeof value === "object" && value !== null && "values" in value) {
      const statusObj = value as { values: string[]; includeMode?: string };
      const statusValue = Array.isArray(statusObj.values) ? statusObj.values.join(",") : String(statusObj.values);
      searchParams.set("status", statusValue);
      if (statusObj.includeMode) searchParams.set("statusMode", statusObj.includeMode);
      return;
    }
    if (Array.isArray(value)) {
      searchParams.set(key, value.join(","));
      return;
    }
    searchParams.set(key, String(value));
  });

  return searchParams;
}

/**
 * magictodo domain TanStack Query hooks with production-ready caching.
 * 
 * Caching strategy:
 * - Tasks: 30s stale time (frequently updated)
 * - Projects: 5min stale time (less frequent updates)
 * - Focus sessions: 1min stale time (active sessions)
 * - Stats: 1min stale time (dashboard metrics)
 */

// Tasks Query Hooks
export function useTasksQuery(
  params?: TaskListParams,
  options?: QueryOverrides<TaskListResponse>
) {
  return useQuery({
    queryKey: MAGICTODO_QUERY_KEYS.list(params),
    queryFn: async () => {
      const searchParams = buildSearchParams(params);
      const response = await fetch(`${api.tasks()}?${searchParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const payload = await response.json();
      const data = payload?.data ?? payload;
      return {
        items: data?.tasks ?? data?.items ?? [],
        total: data?.total,
        limit: data?.limit,
        offset: data?.offset,
      } as TaskListResponse;
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

export function useTaskByIdQuery(id: string, options?: QueryOverrides<unknown>) {
  return useQuery({
    queryKey: MAGICTODO_QUERY_KEYS.byId(id),
    queryFn: async () => {
      const response = await fetch(api.taskById(id));
      if (!response.ok) throw new Error('Failed to fetch task');
      const payload = await response.json();
      return payload?.data ?? payload;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    ...options,
  });
}

// Projects Query Hooks
export function useProjectsQuery(options?: QueryOverrides<ProjectListResponse>) {
  return useQuery({
    queryKey: MAGICTODO_QUERY_KEYS.projects(),
    queryFn: async () => {
      const response = await fetch(api.projects());
      if (!response.ok) throw new Error('Failed to fetch projects');
      const payload = await response.json();
      const data = payload?.data ?? payload;
      return {
        items: data?.projects ?? data?.items ?? [],
        total: data?.total,
      } as ProjectListResponse;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; color?: string }) => {
      const response = await fetch(api.projects(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create project');
      const payload = await response.json();
      return payload?.data ?? payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAGICTODO_QUERY_KEYS.projects() });
    },
  });
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; description?: string; color?: string } }) => {
      const response = await fetch(`${api.projects()}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update project');
      const payload = await response.json();
      return payload?.data ?? payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAGICTODO_QUERY_KEYS.projects() });
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${api.projects()}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete project');
      const payload = await response.json();
      return payload?.data ?? payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAGICTODO_QUERY_KEYS.projects() });
      queryClient.invalidateQueries({ queryKey: MAGICTODO_QUERY_KEYS.lists() });
    },
  });
}

// Focus Session Query Hooks
export function useFocusStreakQuery() {
  return useQuery({
    queryKey: MAGICTODO_QUERY_KEYS.focus.streak(),
    queryFn: async () => {
      const response = await fetch(api.focus.streak());
      if (!response.ok) throw new Error('Failed to fetch focus streak');
      const payload = await response.json();
      return payload?.data ?? payload;
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
  });
}

export function useFocusSessionQuery(options?: QueryOverrides<FocusSessionData>) {
  return useQuery({
    queryKey: MAGICTODO_QUERY_KEYS.focus.session(),
    queryFn: async () => {
      const response = await fetch(api.focus.session());
      if (!response.ok) throw new Error('Failed to fetch focus session');
      const payload = await response.json();
      const data = payload?.data ?? payload;
      return data?.session ?? data;
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useDailyFocusStatsQuery(options?: QueryOverrides<DailyFocusStatsData>) {
  return useQuery({
    queryKey: MAGICTODO_QUERY_KEYS.focus.stats("today"),
    queryFn: async () => {
      const response = await fetch(`${api.focus.stats()}?period=today`);
      if (!response.ok) throw new Error('Failed to fetch focus stats');
      const payload = await response.json();
      const data = payload?.data ?? payload;
      return {
        ...data,
        tasksCompleted: data?.totalTasksCompleted ?? data?.tasksCompleted,
      };
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    ...options,
  });
}

// Snoozed Tasks Query Hook
export function useSnoozedTasksQuery() {
  return useQuery({
    queryKey: MAGICTODO_QUERY_KEYS.snoozed(),
    queryFn: async () => {
      const response = await fetch(`${api.tasks()}?status=snoozed`);
      if (!response.ok) throw new Error('Failed to fetch snoozed tasks');
      const payload = await response.json();
      const data = payload?.data ?? payload;
      return {
        items: data?.tasks ?? data?.items ?? [],
        total: data?.total,
      } as TaskListResponse;
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

// Mutation Hooks
export function useCreateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { title: string; description?: string; priority?: string; projectId?: string }) => {
      const response = await fetch(api.tasks(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAGICTODO_QUERY_KEYS.all });
    },
  });
}

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const response = await fetch(api.taskById(id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update task');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: MAGICTODO_QUERY_KEYS.byId(variables.id) });
      queryClient.invalidateQueries({ queryKey: MAGICTODO_QUERY_KEYS.lists() });
    },
  });
}

export function useDeleteTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(api.taskById(id), {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAGICTODO_QUERY_KEYS.all });
    },
  });
}

export function useSnoozeTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { taskId: string; snoozedUntil?: string; type?: string; preset?: string; reason?: string }) => {
      const response = await fetch(api.snooze(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: data.taskId,
          snoozedUntil: data.snoozedUntil,
          type: data.type,
          preset: data.preset,
          reason: data.reason,
        }),
      });
      if (!response.ok) throw new Error('Failed to snooze task');
      const payload = await response.json();
      return payload?.data ?? payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAGICTODO_QUERY_KEYS.all });
    },
  });
}

export function useUnsnoozeTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { taskId: string }) => {
      const response = await fetch(api.snooze(), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: data.taskId }),
      });
      if (!response.ok) throw new Error('Failed to unsnooze task');
      const payload = await response.json();
      return payload?.data ?? payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAGICTODO_QUERY_KEYS.all });
    },
  });
}

// Focus Session Mutation Hooks
export function useStartFocusSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { taskIds: string[]; dailyGoal?: number; settings?: Record<string, unknown> }) => {
      const response = await fetch(api.focus.session(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to start focus session');
      const payload = await response.json();
      return payload?.data ?? payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAGICTODO_QUERY_KEYS.focus.all() });
    },
  });
}

export function useEndFocusSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { sessionId: string; status?: 'completed' | 'aborted' }) => {
      const response = await fetch(api.focus.session(), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end', status: data.status ?? 'completed', sessionId: data.sessionId }),
      });
      if (!response.ok) throw new Error('Failed to end focus session');
      const payload = await response.json();
      return payload?.data ?? payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAGICTODO_QUERY_KEYS.focus.all() });
    },
  });
}

export function usePauseFocusSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { sessionId: string }) => {
      const response = await fetch(api.focus.session(), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause', sessionId: data.sessionId }),
      });
      if (!response.ok) throw new Error('Failed to pause focus session');
      const payload = await response.json();
      return payload?.data ?? payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAGICTODO_QUERY_KEYS.focus.session() });
    },
  });
}

export function useResumeFocusSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { sessionId: string }) => {
      const response = await fetch(api.focus.session(), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume', sessionId: data.sessionId }),
      });
      if (!response.ok) throw new Error('Failed to resume focus session');
      const payload = await response.json();
      return payload?.data ?? payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAGICTODO_QUERY_KEYS.focus.session() });
    },
  });
}

export function useCompleteFocusTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { sessionId: string; taskId: string }) => {
      const response = await fetch(api.focus.sessionComplete(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to complete focus task');
      const payload = await response.json();
      return payload?.data ?? payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAGICTODO_QUERY_KEYS.focus.session() });
      queryClient.invalidateQueries({ queryKey: MAGICTODO_QUERY_KEYS.lists() });
    },
  });
}

export function useSkipFocusTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { sessionId: string; taskId: string }) => {
      const response = await fetch(api.focus.sessionSkip(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to skip focus task');
      const payload = await response.json();
      return payload?.data ?? payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAGICTODO_QUERY_KEYS.focus.session() });
    },
  });
}
