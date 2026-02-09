/**
 * Tag management server actions.
 * Wires to lib/tags.ts for actual DB operations.
 *
 * @domain magicdrive
 * @layer server
 */

"use server"

import { revalidatePath } from "next/cache"
import { routes } from "@afenda/shared/constants"
import { getAuthContext } from "@afenda/auth/server"
import { logError } from "../pino"
import {
  listTagsByTenant,
  listTagsForObject,
  createTag,
  deleteTag,
  addTagToObject,
  removeTagFromObject,
} from "../lib/tags"
import type { Tag, CreateTagInput, UpdateTagInput } from "@afenda/shared/tags"
import type { TagRow } from "../lib/tags"

/** Tenant context for tag operations */
interface TenantContext {
  tenantId?: string | null
  teamId?: string | null
}

/** Map internal TagRow to the shared Tag interface expected by the UI. */
function toTag(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color ?? undefined,
    createdAt: row.createdAt?.toISOString(),
  }
}

/**
 * Server action: List all tags for a workspace.
 */
export async function listTagsAction(
  workspaceId: string,
  _tenantContext?: TenantContext
): Promise<Tag[]> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) return []

    const tenantId = workspaceId || auth.userId
    const rows = await listTagsByTenant(tenantId)
    return rows.map(toTag)
  } catch (error) {
    logError(error, { context: "listTagsAction" })
    return []
  }
}

/**
 * Server action: Get tags for a document.
 */
export async function getDocumentTagsAction(
  documentId: string,
  _tenantContext?: TenantContext
): Promise<Tag[]> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) return []

    const rows = await listTagsForObject(auth.userId, documentId)
    return rows.map(toTag)
  } catch (error) {
    logError(error, { context: "getDocumentTagsAction" })
    return []
  }
}

/**
 * Server action: Create a new tag.
 */
export async function createTagAction(
  workspaceId: string,
  input: CreateTagInput,
  _tenantContext?: TenantContext
): Promise<{ success: boolean; tag?: Tag; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) return { success: false, error: "Authentication required" }

    const tenantId = workspaceId || auth.userId
    const result = await createTag(tenantId, input.name)
    if (!result.ok) return { success: false, error: result.error }

    revalidatePath(routes.ui.magicdrive.root())
    return { success: true, tag: toTag(result.tag) }
  } catch (error) {
    logError(error, { context: "createTagAction" })
    return { success: false, error: String(error) }
  }
}

/**
 * Server action: Update a tag.
 * Note: lib/tags.ts does not expose an updateTag function yet  this is a partial stub.
 */
export async function updateTagAction(
  _tagId: string,
  _input: UpdateTagInput,
  _tenantContext?: TenantContext
): Promise<{ success: boolean; tag?: Tag; error?: string }> {
  // Tag update (rename/color change) not yet in lib/tags.ts
  return { success: false, error: "Tag update not yet supported" }
}

/**
 * Server action: Delete a tag.
 */
export async function deleteTagAction(
  tagId: string,
  _tenantContext?: TenantContext
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) return { success: false, error: "Authentication required" }

    const result = await deleteTag(auth.userId, tagId)
    if (!result.ok) return { success: false, error: result.error }

    revalidatePath(routes.ui.magicdrive.root())
    return { success: true }
  } catch (error) {
    logError(error, { context: "deleteTagAction" })
    return { success: false, error: String(error) }
  }
}

/**
 * Server action: Add tag to document.
 */
export async function addTagToDocumentAction(
  documentId: string,
  tagId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) return { success: false, error: "Authentication required" }

    const result = await addTagToObject(auth.userId, documentId, tagId)
    if (!result.ok) return { success: false, error: result.error }

    revalidatePath(routes.ui.magicdrive.root())
    return { success: true }
  } catch (error) {
    logError(error, { context: "addTagToDocumentAction" })
    return { success: false, error: String(error) }
  }
}

/**
 * Server action: Remove tag from document.
 */
export async function removeTagFromDocumentAction(
  documentId: string,
  tagId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) return { success: false, error: "Authentication required" }

    const result = await removeTagFromObject(auth.userId, documentId, tagId)
    if (!result.ok) return { success: false, error: result.error }

    revalidatePath(routes.ui.magicdrive.root())
    return { success: true }
  } catch (error) {
    logError(error, { context: "removeTagFromDocumentAction" })
    return { success: false, error: String(error) }
  }
}

/**
 * Server action: Bulk add tag to multiple documents.
 */
export async function bulkAddTagAction(
  documentIds: string[],
  tagId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) return { success: false, error: "Authentication required" }

    const errors: string[] = []
    for (const docId of documentIds) {
      const r = await addTagToObject(auth.userId, docId, tagId)
      if (!r.ok) errors.push(`${docId}: ${r.error}`)
    }

    revalidatePath(routes.ui.magicdrive.root())
    if (errors.length > 0) return { success: false, error: errors.join("; ") }
    return { success: true }
  } catch (error) {
    logError(error, { context: "bulkAddTagAction" })
    return { success: false, error: String(error) }
  }
}

/**
 * Server action: Bulk remove tag from multiple documents.
 */
export async function bulkRemoveTagAction(
  documentIds: string[],
  tagId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) return { success: false, error: "Authentication required" }

    const errors: string[] = []
    for (const docId of documentIds) {
      const r = await removeTagFromObject(auth.userId, docId, tagId)
      if (!r.ok) errors.push(`${docId}: ${r.error}`)
    }

    revalidatePath(routes.ui.magicdrive.root())
    if (errors.length > 0) return { success: false, error: errors.join("; ") }
    return { success: true }
  } catch (error) {
    logError(error, { context: "bulkRemoveTagAction" })
    return { success: false, error: String(error) }
  }
}

