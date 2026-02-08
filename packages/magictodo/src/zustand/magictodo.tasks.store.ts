/**
 * Legacy Zustand store shim over TanStack Query hooks.
 * @deprecated Prefer useTasksQuery / useCreateTaskMutation / useUpdateTaskMutation / useDeleteTaskMutation directly.
 */

"use client";

import type { TaskResponse } from "../zod";
import { 
  useTasksQuery, 
  useCreateTaskMutation, 
  useUpdateTaskMutation, 
  useDeleteTaskMutation 
} from "../query";

/**
 * Backward compatibility wrapper for useTasksQuery.
 * @deprecated Use TanStack Query hooks directly for type-safe, cacheable data fetching.
 */
export function useTasksStore() {
  const { data, isLoading, error, refetch } = useTasksQuery();
  const createMutation = useCreateTaskMutation();
  const updateMutation = useUpdateTaskMutation();
  const deleteMutation = useDeleteTaskMutation();

  return {
    tasks: (data?.items ?? []) as TaskResponse[],
    loading: isLoading,
    error: error ? String(error) : null,
    
    fetchTasks: async (_userId: string, _filters?: Record<string, unknown>) => {
      await refetch();
    },
    
    createTask: async (_userId: string, title: string) => {
      await createMutation.mutateAsync({ title });
    },
    
    updateTaskStatus: async (_userId: string, taskId: string, status: string) => {
      await updateMutation.mutateAsync({ id: taskId, data: { status } });
    },
    
    updateTask: async (_userId: string, taskId: string, updates: Record<string, unknown>) => {
      await updateMutation.mutateAsync({ id: taskId, data: updates });
    },
    
    deleteTask: async (_userId: string, taskId: string) => {
      await deleteMutation.mutateAsync(taskId);
    },
  };
}

export default useTasksStore;
