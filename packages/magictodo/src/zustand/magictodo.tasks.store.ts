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

interface TasksStoreState {
  // Computed from query hooks
}

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
    tasks: (data?.items || []) as any[],
    loading: isLoading,
    error: error ? String(error) : null,
    
    fetchTasks: async (userId: string, filters?: any) => {
      await refetch();
    },
    
    createTask: async (userId: string, title: string) => {
      await createMutation.mutateAsync({ title, userId } as any);
    },
    
    updateTaskStatus: async (userId: string, taskId: string, status: string) => {
      await updateMutation.mutateAsync({ id: taskId, data: { status } });
    },
    
    updateTask: async (userId: string, taskId: string, updates: any) => {
      await updateMutation.mutateAsync({ id: taskId, data: updates });
    },
    
    deleteTask: async (userId: string, taskId: string) => {
      await deleteMutation.mutateAsync(taskId);
    },
  };
}

export default useTasksStore;
