/**
 * @layer domain (magicdrive)
 * @responsibility TanStack Query hooks for folders.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Folder, CreateFolderInput, UpdateFolderInput } from "../zod/magicdrive.folder.zod"

export const folderKeys = {
  all: ["folders"] as const,
  lists: () => [...folderKeys.all, "list"] as const,
  list: (workspaceId: string) => [...folderKeys.lists(), workspaceId] as const,
  details: () => [...folderKeys.all, "detail"] as const,
  detail: (id: string) => [...folderKeys.details(), id] as const,
  tree: (workspaceId: string) => [...folderKeys.all, "tree", workspaceId] as const,
}

interface UseFoldersOptions {
  workspaceId: string
}

/**
 * Query hook for fetching all folders in a workspace.
 */
export function useFolders({ workspaceId }: UseFoldersOptions) {
  return useQuery({
    queryKey: folderKeys.list(workspaceId),
    queryFn: async (): Promise<Folder[]> => {
      // TODO: Replace with actual API call
      const res = await fetch(`/api/magicdrive/folders?workspaceId=${workspaceId}`)
      if (!res.ok) throw new Error("Failed to fetch folders")
      return res.json()
    },
  })
}

/**
 * Query hook for fetching a single folder.
 */
export function useFolder(id: string) {
  return useQuery({
    queryKey: folderKeys.detail(id),
    queryFn: async (): Promise<Folder> => {
      const res = await fetch(`/api/magicdrive/folders/${id}`)
      if (!res.ok) throw new Error("Failed to fetch folder")
      return res.json()
    },
    enabled: !!id,
  })
}

/**
 * Mutation hook for creating a folder.
 */
export function useCreateFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateFolderInput): Promise<Folder> => {
      const res = await fetch("/api/magicdrive/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error("Failed to create folder")
      return res.json()
    },
    onSuccess: (folder) => {
      queryClient.invalidateQueries({ queryKey: folderKeys.list(folder.workspaceId) })
      queryClient.invalidateQueries({ queryKey: folderKeys.tree(folder.workspaceId) })
    },
  })
}

/**
 * Mutation hook for updating a folder.
 */
export function useUpdateFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string
      input: UpdateFolderInput
    }): Promise<Folder> => {
      const res = await fetch(`/api/magicdrive/folders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error("Failed to update folder")
      return res.json()
    },
    onSuccess: (folder) => {
      queryClient.invalidateQueries({ queryKey: folderKeys.detail(folder.id) })
      queryClient.invalidateQueries({ queryKey: folderKeys.list(folder.workspaceId) })
      queryClient.invalidateQueries({ queryKey: folderKeys.tree(folder.workspaceId) })
    },
  })
}

/**
 * Mutation hook for deleting a folder.
 */
export function useDeleteFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      workspaceId,
    }: {
      id: string
      workspaceId: string
    }): Promise<void> => {
      const res = await fetch(`/api/magicdrive/folders/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete folder")
    },
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: folderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: folderKeys.tree(workspaceId) })
    },
  })
}
