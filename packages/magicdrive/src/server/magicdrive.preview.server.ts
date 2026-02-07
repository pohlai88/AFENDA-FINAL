/**
 * @layer domain (magicdrive)
 * @responsibility Preview and thumbnail generation server actions.
 *
 * Wires to lib/server/magicdrive/preview.ts and thumbs.ts
 */

"use server"

import { eq } from "drizzle-orm"
import { logError } from "../pino"

import {
  getDb,
  magicdriveObjects,
  magicdriveObjectVersions,
} from "@afenda/shared/db"
import { runPreviewForVersion } from "../lib/preview"
import { runThumbnailsForVersion } from "../lib/thumbs"
import { getAuthContext } from "@afenda/auth/server"

export interface PreviewGenerationResult {
  success: boolean
  error?: string
}

export interface ThumbnailGenerationResult {
  success: boolean
  pages?: number
  error?: string
}

/**
 * Server action: Trigger preview generation for a document.
 * Usually called automatically after upload, but can be re-triggered.
 */
export async function generatePreviewAction(
  objectId: string,
  versionId?: string
): Promise<PreviewGenerationResult> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return { success: false, error: "Unauthorized" }
    }

    const db = getDb()

    const [obj] = await db
      .select()
      .from(magicdriveObjects)
      .where(eq(magicdriveObjects.id, objectId))
      .limit(1)

    if (!obj) {
      return { success: false, error: "Document not found" }
    }

    const targetVersionId = versionId || obj.currentVersionId
    if (!targetVersionId) {
      return { success: false, error: "No version available" }
    }

    const [version] = await db
      .select()
      .from(magicdriveObjectVersions)
      .where(eq(magicdriveObjectVersions.id, targetVersionId))
      .limit(1)

    if (!version) {
      return { success: false, error: "Version not found" }
    }

    const result = await runPreviewForVersion(
      obj.tenantId,
      objectId,
      targetVersionId,
      version.mimeType || "application/octet-stream"
    )

    if (!result.ok) {
      return { success: false, error: result.error }
    }

    return { success: true }
  } catch (error) {
    logError(error, { operation: "generatePreviewAction" })
    return { success: false, error: String(error) }
  }
}

/**
 * Server action: Trigger thumbnail generation for a document.
 * Usually called automatically after upload, but can be re-triggered.
 */
export async function generateThumbnailAction(
  objectId: string,
  versionId?: string
): Promise<ThumbnailGenerationResult> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return { success: false, error: "Unauthorized" }
    }

    const db = getDb()

    const [obj] = await db
      .select()
      .from(magicdriveObjects)
      .where(eq(magicdriveObjects.id, objectId))
      .limit(1)

    if (!obj) {
      return { success: false, error: "Document not found" }
    }

    const targetVersionId = versionId || obj.currentVersionId
    if (!targetVersionId) {
      return { success: false, error: "No version available" }
    }

    const [version] = await db
      .select()
      .from(magicdriveObjectVersions)
      .where(eq(magicdriveObjectVersions.id, targetVersionId))
      .limit(1)

    if (!version) {
      return { success: false, error: "Version not found" }
    }

    const result = await runThumbnailsForVersion(
      obj.tenantId,
      objectId,
      targetVersionId,
      version.mimeType || "application/octet-stream"
    )

    if (!result.ok) {
      return { success: false, error: result.error }
    }

    return { success: true, pages: result.pages }
  } catch (error) {
    logError(error, { operation: "generateThumbnailAction" })
    return { success: false, error: String(error) }
  }
}

/**
 * Server action: Regenerate all processing (preview, thumbnail) for a document.
 */
export async function regenerateAllAction(
  objectId: string,
  versionId?: string
): Promise<{ success: boolean; preview: boolean; thumbnail: boolean; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return { success: false, preview: false, thumbnail: false, error: "Unauthorized" }
    }

    const previewResult = await generatePreviewAction(objectId, versionId)
    const thumbnailResult = await generateThumbnailAction(objectId, versionId)

    return {
      success: previewResult.success || thumbnailResult.success,
      preview: previewResult.success,
      thumbnail: thumbnailResult.success,
      error:
        !previewResult.success && !thumbnailResult.success
          ? `Preview: ${previewResult.error}; Thumbnail: ${thumbnailResult.error}`
          : undefined,
    }
  } catch (error) {
    logError(error, { operation: "regenerateAllAction" })
    return { success: false, preview: false, thumbnail: false, error: String(error) }
  }
}

