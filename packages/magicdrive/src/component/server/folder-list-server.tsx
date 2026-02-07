/**
 * @layer domain (magicdrive)
 * @responsibility Server component for fetching folder list.
 */

import type { Folder } from "../../zod/magicdrive.folder.zod"

export interface FolderListServerProps {
  workspaceId: string
  parentId?: string | null
}

/**
 * Server component that fetches folders.
 * Use with React Suspense for streaming.
 */
export async function FolderListServer({
  workspaceId,
  parentId = null,
}: FolderListServerProps) {
  // TODO: Fetch folders from database
  const folders: Folder[] = []

  return { folders }
}

export interface FolderTreeServerProps {
  workspaceId: string
}

/**
 * Server component that fetches the complete folder tree.
 */
export async function getFolderTreeServer({
  workspaceId,
}: FolderTreeServerProps) {
  // TODO: Fetch folder tree from database
  // This would use a recursive CTE or similar to build the tree
  return { tree: [] }
}
