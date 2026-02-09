/**
 * Document CRUD server actions.
 * Wires to lib/list.ts and lib/update.ts for actual DB operations.
 *
 * @domain magicdrive
 * @layer server
 */

"use server"

import { revalidatePath } from "next/cache"
import { routes } from "@afenda/shared/constants"
import { getAuthContext } from "@afenda/auth/server"
import { logError } from "../pino"
import { listObjects, getObjectById } from "../lib/list"
import { updateObjectStatus, deleteObject } from "../lib/update"
import type { ObjectWithVersion } from "../lib/list"

/**
 * Document DTO returned to the UI.
 * Intentionally NOT the strict Zod Document type — the DB model
 * uses different field names/enums than the Zod schema.
 */
export interface DocumentDTO {
  id: string
  title: string | null
  type: string
  status: string
  folderId: string | null
  workspaceId: string
  createdAt: string
  updatedAt: string
  ownerId: string
  isStarred: boolean
  tags: Array<{ id: string; name: string }>
}

/** Map internal ObjectWithVersion to the DocumentDTO shape for the UI. */
function toDocument(obj: ObjectWithVersion): DocumentDTO {
  return {
    id: obj.id,
    title: obj.title,
    type: obj.docType,
    status: obj.status,
    folderId: null,
    workspaceId: obj.tenantId,
    createdAt: obj.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: obj.updatedAt?.toISOString() ?? new Date().toISOString(),
    ownerId: obj.ownerId,
    isStarred: false,
    tags: obj.tags?.map((t) => ({ id: t.id, name: t.name })) ?? [],
  }
}

/**
 * Server action: List documents with filters.
 * Wires to lib/list.ts listObjects (full Drizzle query with FTS, pagination, sort).
 */
export async function listDocumentsAction(params: {
  workspaceId: string
  folderId?: string | null
  tenantId?: string | null
  teamId?: string | null
  status?: string
  type?: string
  search?: string
  tagIds?: string[]
  sortBy?: string
  sortOrder?: "asc" | "desc"
  limit?: number
  offset?: number
}): Promise<{ documents: DocumentDTO[]; total: number }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) return { documents: [], total: 0 }

    const tenantId = params.workspaceId || auth.userId
    const result = await listObjects(
      tenantId,
      {
        status: params.status,
        docType: params.type,
        q: params.search,
        tagId: params.tagIds?.[0],
        sortBy: (params.sortBy as "createdAt" | "title" | "sizeBytes") ?? "createdAt",
        sortOrder: params.sortOrder ?? "desc",
        limit: params.limit ?? 50,
        offset: params.offset ?? 0,
      },
      { tenantId: params.tenantId, teamId: params.teamId }
    )

    return {
      documents: result.items.map(toDocument),
      total: result.total,
    }
  } catch (error) {
    logError(error, { context: "listDocumentsAction" })
    return { documents: [], total: 0 }
  }
}

export async function getDocumentAction(
  id: string,
  tenantContext?: { tenantId?: string | null; teamId?: string | null }
): Promise<DocumentDTO | null> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) return null

    const obj = await getObjectById(auth.userId, id, tenantContext)
    if (!obj) return null
    return toDocument(obj)
  } catch (error) {
    logError(error, { context: "getDocumentAction" })
    return null
  }
}

export async function createDocumentAction(
  _input: unknown
): Promise<{ success: boolean; document?: DocumentDTO; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) return { success: false, error: "Authentication required" }

    // Document creation is handled by the upload->ingest flow (upload.server.ts -> lib/ingest.ts).
    revalidatePath(routes.ui.magicdrive.root())
    return { success: false, error: "Use upload flow to create documents" }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function updateDocumentAction(
  id: string,
  input: { status?: string; title?: string }
): Promise<{ success: boolean; document?: DocumentDTO; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) return { success: false, error: "Authentication required" }

    if (input.status) {
      const result = await updateObjectStatus(auth.userId, id, input.status)
      if (!result.ok) return { success: false, error: result.error }
    }

    revalidatePath(routes.ui.magicdrive.root())
    return { success: true }
  } catch (error) {
    logError(error, { context: "updateDocumentAction" })
    return { success: false, error: String(error) }
  }
}

export async function archiveDocumentAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) return { success: false, error: "Authentication required" }

    const result = await updateObjectStatus(auth.userId, id, "archived")
    if (!result.ok) return { success: false, error: result.error }

    revalidatePath(routes.ui.magicdrive.root())
    return { success: true }
  } catch (error) {
    logError(error, { context: "archiveDocumentAction" })
    return { success: false, error: String(error) }
  }
}

export async function deleteDocumentAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) return { success: false, error: "Authentication required" }

    const result = await deleteObject(auth.userId, id)
    if (!result.ok) return { success: false, error: result.error }

    revalidatePath(routes.ui.magicdrive.root())
    return { success: true }
  } catch (error) {
    logError(error, { context: "deleteDocumentAction" })
    return { success: false, error: String(error) }
  }
}

export async function restoreDocumentAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) return { success: false, error: "Authentication required" }

    const result = await updateObjectStatus(auth.userId, id, "inbox")
    if (!result.ok) return { success: false, error: result.error }

    revalidatePath(routes.ui.magicdrive.root())
    return { success: true }
  } catch (error) {
    logError(error, { context: "restoreDocumentAction" })
    return { success: false, error: String(error) }
  }
}

export async function moveDocumentAction(
  _documentId: string,
  _folderId: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) return { success: false, error: "Authentication required" }

    // Folder move: not yet in DB schema (no folder_id FK on magicdriveObjects).
    revalidatePath(routes.ui.magicdrive.root())
    return { success: false, error: "Folder move not yet supported" }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function toggleStarDocumentAction(
  _id: string,
  _starred: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) return { success: false, error: "Authentication required" }

    // Star/favorite: not yet in DB schema (no is_starred column).
    revalidatePath(routes.ui.magicdrive.root())
    return { success: false, error: "Star toggle not yet supported" }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

