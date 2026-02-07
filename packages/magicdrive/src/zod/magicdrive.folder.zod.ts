/**
 * @layer domain (magicdrive)
 * @responsibility Folder Zod schemas.
 */

import { z } from "zod"

/**
 * Folder schema — represents a container for documents.
 */
export const FolderSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  parentId: z.string().uuid().nullable(),
  /** Color for folder icon */
  color: z.string().nullable(),
  /** Icon identifier */
  icon: z.string().nullable(),
  /** Position in parent folder */
  position: z.number().int().default(0),
  /** Soft delete */
  isArchived: z.boolean().default(false),
  /** Owner user ID */
  ownerId: z.string().uuid(),
  /** Workspace ID */
  workspaceId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type Folder = z.infer<typeof FolderSchema>

export const CreateFolderSchema = FolderSchema.pick({
  name: true,
  parentId: true,
  color: true,
  icon: true,
  workspaceId: true,
})

export type CreateFolderInput = z.infer<typeof CreateFolderSchema>

export const UpdateFolderSchema = FolderSchema.pick({
  name: true,
  parentId: true,
  color: true,
  icon: true,
  position: true,
}).partial()

export type UpdateFolderInput = z.infer<typeof UpdateFolderSchema>

/**
 * Folder tree node (with children).
 * Schema input may have optional position (from default); output has position: number.
 */
export const FolderTreeNodeSchema = FolderSchema.extend({
  children: z.lazy(() => z.array(FolderTreeNodeSchema)),
  documentCount: z.number().int().optional(),
}) as unknown as z.ZodType<FolderTreeNode>

export type FolderTreeNode = Folder & {
  children: FolderTreeNode[]
  documentCount?: number
}
