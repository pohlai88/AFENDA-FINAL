/**
 * @layer domain (magicdrive)
 * @responsibility Document Zod schemas.
 */

import { z } from "zod"
import type { Taggable, Tag } from "@afenda/shared/tags"
import type { Attachable, Attachment } from "@afenda/shared/attachments"

/**
 * Document type enumeration.
 */
export const DocumentTypeSchema = z.enum([
  "file",
  "note",
  "template",
  "link",
  "shortcut",
])

export type DocumentType = z.infer<typeof DocumentTypeSchema>

/**
 * Document status.
 */
export const DocumentStatusSchema = z.enum([
  "draft",
  "published",
  "archived",
])

export type DocumentStatus = z.infer<typeof DocumentStatusSchema>

/**
 * Document schema — file, note, or template.
 */
export const DocumentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(500),
  type: DocumentTypeSchema,
  status: DocumentStatusSchema.default("draft"),
  /** Parent folder ID */
  folderId: z.string().uuid().nullable(),
  /** For file type: storage URL */
  fileUrl: z.string().url().nullable(),
  /** For file type: size in bytes */
  fileSize: z.number().int().nullable(),
  /** For file type: MIME type */
  mimeType: z.string().nullable(),
  /** For note/template type: content */
  content: z.string().nullable(),
  /** Description/summary */
  description: z.string().nullable(),
  /** Thumbnail/preview URL */
  thumbnailUrl: z.string().url().nullable(),
  /** Position in folder */
  position: z.number().int().default(0),
  /** Starred/pinned */
  isStarred: z.boolean().default(false),
  /** Soft delete */
  isArchived: z.boolean().default(false),
  /** Owner user ID */
  ownerId: z.string().uuid(),
  /** Workspace ID */
  workspaceId: z.string().uuid(),
  /** For sharing: implements Shareable */
  shareScope: z.enum(["private", "workspace", "public"]).default("private"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type Document = z.infer<typeof DocumentSchema>

/**
 * Document with tags and attachments (hydrated).
 */
export interface DocumentWithRelations extends Document, Taggable, Attachable {
  tags?: Tag[]
  attachments?: Attachment[]
  folder?: { id: string; name: string } | null
}

export const CreateDocumentSchema = DocumentSchema.pick({
  name: true,
  type: true,
  folderId: true,
  fileUrl: true,
  fileSize: true,
  mimeType: true,
  content: true,
  description: true,
  workspaceId: true,
})

export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>

export const UpdateDocumentSchema = DocumentSchema.pick({
  name: true,
  type: true,
  status: true,
  folderId: true,
  fileUrl: true,
  fileSize: true,
  mimeType: true,
  content: true,
  description: true,
  thumbnailUrl: true,
  position: true,
  isStarred: true,
  shareScope: true,
}).partial()

export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>
