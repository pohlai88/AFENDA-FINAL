/**
 * Legacy Zustand store shim over TanStack Query hooks.
 * @deprecated Prefer useProjectsQuery / useCreateProjectMutation / useUpdateProjectMutation / useDeleteProjectMutation directly.
 */

"use client";

import type { ProjectResponse } from "../zod";
import {
  useProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} from "../query";

/**
 * Backward compatibility wrapper for useProjectsQuery.
 * @deprecated Use TanStack Query hooks directly for type-safe, cacheable data fetching.
 */
export function useProjectsStore() {
  const { data, isLoading, error, refetch } = useProjectsQuery();
  const createMutation = useCreateProjectMutation();
  const updateMutation = useUpdateProjectMutation();
  const deleteMutation = useDeleteProjectMutation();

  return {
    projects: (data?.items ?? []) as ProjectResponse[],
    loading: isLoading,
    error: error ? String(error) : null,

    fetchProjects: async (_userId: string) => {
      await refetch();
    },

    createProject: async (_userId: string, projectData: Record<string, unknown>) => {
      await createMutation.mutateAsync(projectData as { name: string; color?: string; description?: string });
    },

    updateProjectApi: async (_userId: string, projectId: string, updates: Record<string, unknown>) => {
      await updateMutation.mutateAsync({ id: projectId, data: updates });
    },

    deleteProject: async (_userId: string, projectId: string) => {
      await deleteMutation.mutateAsync(projectId);
    },
  };
}

export default useProjectsStore;
