/**
 * Bulk operations server actions.
 * Wires to lib/update.ts runBulkAction for actual DB operations.
 *
 * @domain magicdrive
 * @layer server
 */

"use server"

import { revalidatePath } from "next/cache"
import { routes } from "@afenda/shared/constants"
import { getAuthContext } from "@afenda/auth/server"
import { logError } from "../pino"
import { runBulkAction, updateObjectStatus } from "../lib/update"
import { removeTagFromObject } from "../lib/tags"
import type { BulkAction } from "../lib/update"

/** Tenant context for bulk operations */
interface TenantContext {
  tenantId?: string | null
  teamId?: string | null
}

export type BulkDocumentAction =
  | "archive"
  | "delete"
  | "restore"
  | "move"
  | "add-tag"
  | "remove-tag"
  | "star"
  | "unstar"
  | "change-status"
  | "download"

export interface BulkActionResult {
  success: boolean
  totalCount: number
  successCount: number
  failedCount: number
  failedIds: Array<{ id: string; error: string }>
  errors: string[]
}

export interface BulkDocumentPayload {
  action: BulkDocumentAction
  documentIds: string[]
  /** For move action */
  targetFolderId?: string | null
  /** For tag actions */
  tagId?: string
  /** For status change */
  status?: string
}

/** Map UI action names to lib BulkAction names */
function toLibAction(action: BulkDocumentAction): BulkAction | null {
  switch (action) {
    case "archive":
      return "archive"
    case "delete":
      return "delete"
    case "restore":
      return "activate"
    default:
      return null
  }
}

/**
 * Server action: Execute bulk operation on documents.
 * Delegates to lib/update.ts runBulkAction for archive/delete/restore,
 * and lib/tags.ts for tag operations.
 */
export async function bulkDocumentAction(
  payload: BulkDocumentPayload,
  _tenantContext?: TenantContext
): Promise<BulkActionResult> {
  const { action, documentIds, tagId, status } = payload
  const results: BulkActionResult = {
    success: true,
    totalCount: documentIds.length,
    successCount: 0,
    failedCount: 0,
    failedIds: [],
    errors: [],
  }

  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return {
        ...results,
        success: false,
        errors: ["Authentication required"],
      }
    }

    const tenantId = auth.userId

    // Handle bulk archive / delete / restore via runBulkAction
    const libAction = toLibAction(action)
    if (libAction) {
      const r = await runBulkAction(tenantId, documentIds, libAction)
      if (!r.ok) {
        return { ...results, success: false, errors: [r.error] }
      }
      results.successCount = r.updated
      revalidatePath(routes.ui.magicdrive.root())
      return results
    }

    // Handle tag operations
    if (action === "add-tag") {
      if (!tagId) throw new Error("tagId required for add-tag action")
      const r = await runBulkAction(tenantId, documentIds, "addTag", tagId)
      if (!r.ok) return { ...results, success: false, errors: [r.error] }
      results.successCount = r.updated
      revalidatePath(routes.ui.magicdrive.root())
      return results
    }

    if (action === "remove-tag") {
      if (!tagId) throw new Error("tagId required for remove-tag action")
      const errors: string[] = []
      for (const docId of documentIds) {
        const r = await removeTagFromObject(tenantId, docId, tagId)
        if (r.ok) results.successCount++
        else errors.push(`${docId}: ${r.error}`)
      }
      results.failedCount = documentIds.length - results.successCount
      if (errors.length) results.errors = errors
      results.success = results.failedCount === 0
      revalidatePath(routes.ui.magicdrive.root())
      return results
    }

    if (action === "change-status") {
      if (!status) throw new Error("status required for change-status action")
      const errors: string[] = []
      for (const docId of documentIds) {
        const r = await updateObjectStatus(tenantId, docId, status)
        if (r.ok) results.successCount++
        else errors.push(`${docId}: ${r.error}`)
      }
      results.failedCount = documentIds.length - results.successCount
      if (errors.length) results.errors = errors
      results.success = results.failedCount === 0
      revalidatePath(routes.ui.magicdrive.root())
      return results
    }

    if (action === "download") {
      // Download is handled client-side; no-op on server
      results.successCount = documentIds.length
      return results
    }

    // Unsupported actions (move, star, unstar)
    return {
      ...results,
      success: false,
      errors: [`Action "${action}" not yet supported`],
    }
  } catch (error) {
    logError(error, { context: "bulkDocumentAction" })
    return {
      ...results,
      success: false,
      failedCount: documentIds.length,
      failedIds: documentIds.map((id) => ({ id, error: String(error) })),
      errors: [String(error)],
    }
  }
}

/**
 * Server action: Bulk archive documents.
 * Convenience wrapper over bulkDocumentAction.
 */
export async function bulkArchiveAction(
  documentIds: string[]
): Promise<BulkActionResult> {
  return bulkDocumentAction({ action: "archive", documentIds })
}

/**
 * Server action: Bulk delete documents.
 * Convenience wrapper over bulkDocumentAction.
 */
export async function bulkDeleteAction(
  documentIds: string[]
): Promise<BulkActionResult> {
  return bulkDocumentAction({ action: "delete", documentIds })
}

/**
 * Server action: Bulk restore documents.
 * Convenience wrapper over bulkDocumentAction.
 */
export async function bulkRestoreAction(
  documentIds: string[]
): Promise<BulkActionResult> {
  return bulkDocumentAction({ action: "restore", documentIds })
}

