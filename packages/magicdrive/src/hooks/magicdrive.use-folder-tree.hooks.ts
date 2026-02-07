/**
 * @layer domain (magicdrive)
 * @responsibility Hook for managing folder tree state.
 */

"use client"

import { useCallback, useMemo } from "react"
import type { Folder, FolderTreeNode } from "../zod/magicdrive.folder.zod"

/**
 * Builds a tree from flat folder list.
 */
export function buildFolderTree(folders: Folder[]): FolderTreeNode[] {
  const map = new Map<string, FolderTreeNode>()
  const roots: FolderTreeNode[] = []

  // Create nodes
  for (const folder of folders) {
    map.set(folder.id, { ...folder, children: [] })
  }

  // Build tree
  for (const folder of folders) {
    const node = map.get(folder.id)!
    if (folder.parentId && map.has(folder.parentId)) {
      map.get(folder.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  // Sort children by position
  const sortChildren = (nodes: FolderTreeNode[]): FolderTreeNode[] => {
    return nodes
      .sort((a, b) => a.position - b.position)
      .map((node) => ({
        ...node,
        children: sortChildren(node.children),
      }))
  }

  return sortChildren(roots)
}

/**
 * Hook for folder tree operations.
 */
export function useFolderTree(folders: Folder[]) {
  const tree = useMemo(() => buildFolderTree(folders), [folders])

  const findFolder = useCallback(
    (id: string): FolderTreeNode | null => {
      const search = (nodes: FolderTreeNode[]): FolderTreeNode | null => {
        for (const node of nodes) {
          if (node.id === id) return node
          const found = search(node.children)
          if (found) return found
        }
        return null
      }
      return search(tree)
    },
    [tree]
  )

  const getBreadcrumbs = useCallback(
    (folderId: string): Folder[] => {
      const breadcrumbs: Folder[] = []
      let current = findFolder(folderId)

      while (current) {
        breadcrumbs.unshift(current)
        current = current.parentId ? findFolder(current.parentId) : null
      }

      return breadcrumbs
    },
    [findFolder]
  )

  const getDescendantIds = useCallback(
    (folderId: string): string[] => {
      const ids: string[] = []
      const collect = (nodes: FolderTreeNode[]) => {
        for (const node of nodes) {
          ids.push(node.id)
          collect(node.children)
        }
      }

      const folder = findFolder(folderId)
      if (folder) {
        collect(folder.children)
      }

      return ids
    },
    [findFolder]
  )

  return {
    tree,
    findFolder,
    getBreadcrumbs,
    getDescendantIds,
  }
}
