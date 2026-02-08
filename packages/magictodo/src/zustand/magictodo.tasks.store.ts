/**
 * Temporary Zustand stores for backward compatibility
 * TODO: Migrate fully to TanStack Query hooks
 */

"use client";

import { create } from "zustand";
import { 
  useTasksQuery, 
  useCreateTaskMutation, 
  useUpdateTaskMutation, 
  useDeleteTaskMutation 
} from "../query";

// TasksStoreState removed — empty interface was unused (query hooks provide the actual types)

/**
 * Backward compatibility wrapper for useTasksQuery
 * Components should migrate to using query hooks directly
 */
export function useTasksStore() {
  const { data, isLoading, error, refetch } = useTasksQuery();
  const createMutation = useCreateTaskMutation();
  const updateMutation = useUpdateTaskMutation();
  const deleteMutation = useDeleteTaskMutation();

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy store interface, values dynamically accessed
    tasks: (data?.items || []) as any[],
    loading: isLoading,
    error: error ? String(error) : null,
    
    fetchTasks: async (userId: string, filters?: Record<string, unknown>) => {
      await refetch();
    },
    
    createTask: async (userId: string, title: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mutation input shape mismatch with hook types
      await createMutation.mutateAsync({ title, userId } as any);
    },
    
    updateTaskStatus: async (userId: string, taskId: string, status: string) => {
      await updateMutation.mutateAsync({ id: taskId, data: { status } });
    },
    
    updateTask: async (userId: string, taskId: string, updates: Record<string, unknown>) => {
      await updateMutation.mutateAsync({ id: taskId, data: updates });
    },
    
    deleteTask: async (userId: string, taskId: string) => {
      await deleteMutation.mutateAsync(taskId);
    },
  };
}

export default useTasksStore;
