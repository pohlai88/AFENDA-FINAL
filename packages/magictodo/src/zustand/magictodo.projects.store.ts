/**
 * Temporary Zustand stores for backward compatibility
 * TODO: Migrate fully to TanStack Query hooks
 */

"use client";

import { useProjectsQuery } from "../query";

/**
 * Backward compatibility wrapper for useProjectsQuery
 * Components should migrate to using query hooks directly
 */
export function useProjectsStore() {
  const { data, isLoading, error, refetch } = useProjectsQuery();

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy store interface, values dynamically accessed
    projects: (data?.items || []) as any[],
    loading: isLoading,
    error: error ? String(error) : null,
    
    fetchProjects: async (userId: string) => {
      await refetch();
    },
    
    createProject: async (_userId: string, _projectData: Record<string, unknown>) => {
      // TODO: Implement when project mutation hooks are added
    },
    
    updateProjectApi: async (_userId: string, _projectId: string, _updates: Record<string, unknown>) => {
      // TODO: Implement when project mutation hooks are added
    },
    
    deleteProject: async (_userId: string, _projectId: string) => {
      // TODO: Implement when project mutation hooks are added
    },
  };
}

export default useProjectsStore;
