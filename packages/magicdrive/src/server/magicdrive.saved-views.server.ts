/**
 * Saved views server actions.
 * Wires directly to Drizzle (magicdriveSavedViews table) for DB operations.
 *
 * @domain magicdrive
 * @layer server
 */

"use server"

import { revalidatePath } from "next/cache"
import { routes } from "@afenda/shared/constants"
import { getAuthContext } from "@afenda/auth/server"
import { getDb } from "@afenda/magicdrive/server/db"
import { eq, and } from "drizzle-orm"
import { randomUUID } from "node:crypto"
import { logError } from "../pino"
import { magicdriveSavedViews } from "../drizzle/magicdrive.schema"
import type { SavedView, CreateSavedViewInput, UpdateSavedViewInput } from "@afenda/shared/saved-views"

/** Tenant context for saved view operations */
interface TenantContext {
  tenantId?: string | null
  teamId?: string | null
}

/** Map DB row to the shared SavedView interface. */
function toSavedView(row: typeof magicdriveSavedViews.$inferSelect): SavedView {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    filters: row.filters ?? {},
    isDefault: row.isDefault ?? false,
    isShared: row.isPublic ?? false,
    createdBy: row.userId,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString(),
  }
}

/**
 * Server action: List saved views for a workspace.
 */
export async function listSavedViewsAction(
  workspaceId: string,
  _tenantContext?: TenantContext
): Promise<SavedView[]> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) return []

    const db = getDb()
    const tenantId = workspaceId || auth.userId
    const rows = await db
      .select()
      .from(magicdriveSavedViews)
      .where(
        and(
          eq(magicdriveSavedViews.tenantId, tenantId),
          eq(magicdriveSavedViews.userId, auth.userId)
        )
      )
    return rows.map(toSavedView)
  } catch (error) {
    logError(error, { context: "listSavedViewsAction" })
    return []
  }
}

/**
 * Server action: Get single saved view by ID.
 */
export async function getSavedViewAction(
  id: string,
  _tenantContext?: TenantContext
): Promise<SavedView | null> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) return null

    const db = getDb()
    const [row] = await db
      .select()
      .from(magicdriveSavedViews)
      .where(
        and(
          eq(magicdriveSavedViews.id, id),
          eq(magicdriveSavedViews.userId, auth.userId)
        )
      )
      .limit(1)
    if (!row) return null
    return toSavedView(row)
  } catch (error) {
    logError(error, { context: "getSavedViewAction" })
    return null
  }
}

/**
 * Server action: Create a new saved view.
 */
export async function createSavedViewAction(
  input: CreateSavedViewInput,
  _tenantContext?: TenantContext
): Promise<{ success: boolean; view?: SavedView; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) return { success: false, error: "Authentication required" }

    const db = getDb()
    const id = randomUUID()
    await db.insert(magicdriveSavedViews).values({
      id,
      tenantId: _tenantContext?.tenantId ?? auth.userId,
      teamId: _tenantContext?.teamId ?? auth.userId,
      userId: auth.userId,
      name: input.name,
      description: input.description,
      filters: input.filters ?? {},
      isPublic: input.isShared ?? false,
      isDefault: input.isDefault ?? false,
    })

    const [row] = await db
      .select()
      .from(magicdriveSavedViews)
      .where(eq(magicdriveSavedViews.id, id))
      .limit(1)
    if (!row) return { success: false, error: "Failed to create saved view" }

    revalidatePath(routes.ui.magicdrive.root())
    return { success: true, view: toSavedView(row) }
  } catch (error) {
    logError(error, { context: "createSavedViewAction" })
    return { success: false, error: String(error) }
  }
}

/**
 * Server action: Update a saved view.
 */
export async function updateSavedViewAction(
  id: string,
  input: UpdateSavedViewInput,
  _tenantContext?: TenantContext
): Promise<{ success: boolean; view?: SavedView; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) return { success: false, error: "Authentication required" }

    const db = getDb()
    await db
      .update(magicdriveSavedViews)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.filters !== undefined && { filters: input.filters }),
        ...(input.isShared !== undefined && { isPublic: input.isShared }),
        ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(magicdriveSavedViews.id, id),
          eq(magicdriveSavedViews.userId, auth.userId)
        )
      )

    const [row] = await db
      .select()
      .from(magicdriveSavedViews)
      .where(eq(magicdriveSavedViews.id, id))
      .limit(1)
    if (!row) return { success: false, error: "View not found" }

    revalidatePath(routes.ui.magicdrive.root())
    return { success: true, view: toSavedView(row) }
  } catch (error) {
    logError(error, { context: "updateSavedViewAction" })
    return { success: false, error: String(error) }
  }
}

/**
 * Server action: Delete a saved view.
 */
export async function deleteSavedViewAction(
  id: string,
  _tenantContext?: TenantContext
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) return { success: false, error: "Authentication required" }

    const db = getDb()
    await db
      .delete(magicdriveSavedViews)
      .where(
        and(
          eq(magicdriveSavedViews.id, id),
          eq(magicdriveSavedViews.userId, auth.userId)
        )
      )

    revalidatePath(routes.ui.magicdrive.root())
    return { success: true }
  } catch (error) {
    logError(error, { context: "deleteSavedViewAction" })
    return { success: false, error: String(error) }
  }
}

/**
 * Server action: Set a view as default.
 */
export async function setDefaultViewAction(
  workspaceId: string,
  viewId: string | null,
  _tenantContext?: TenantContext
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) return { success: false, error: "Authentication required" }

    const db = getDb()
    const tenantId = workspaceId || auth.userId

    // Reset all defaults for this user
    await db
      .update(magicdriveSavedViews)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(
        and(
          eq(magicdriveSavedViews.tenantId, tenantId),
          eq(magicdriveSavedViews.userId, auth.userId),
          eq(magicdriveSavedViews.isDefault, true)
        )
      )

    // Set new default
    if (viewId) {
      await db
        .update(magicdriveSavedViews)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(
          and(
            eq(magicdriveSavedViews.id, viewId),
            eq(magicdriveSavedViews.userId, auth.userId)
          )
        )
    }

    revalidatePath(routes.ui.magicdrive.root())
    return { success: true }
  } catch (error) {
    logError(error, { context: "setDefaultViewAction" })
    return { success: false, error: String(error) }
  }
}

/**
 * Server action: Reorder saved views.
 * Note: The schema does not have a sort_order column yet; this is a no-op.
 */
export async function reorderSavedViewsAction(
  _workspaceId: string,
  _orderedIds: string[],
  _tenantContext?: TenantContext
): Promise<{ success: boolean; error?: string }> {
  // No sort_order column in magicdriveSavedViews table yet.
  return { success: false, error: "Reorder not yet supported (no sort_order column)" }
}

