/**
 * @layer domain (magicdrive)
 * @responsibility OCR and metadata extraction server actions.
 *
 * Wires to lib/server/magicdrive/ocr.ts
 */

"use server"

import { eq } from "drizzle-orm"
import { logError } from "../pino"

import {
  getDb,
  getDbClient,
  magicdriveObjects,
  magicdriveObjectVersions,
  magicdriveObjectIndex,
} from "@afenda/shared/db"
import { runOcrForVersion } from "../lib/ocr"
import { getAuthContext } from "@afenda/auth/server"

export interface OcrResult {
  success: boolean
  extractedLength?: number
  error?: string
}

export interface ExtractedMetadata {
  objectId: string
  versionId: string
  extractedText: string | null
  extractedFields: Record<string, unknown> | null
  textHash: string | null
  updatedAt: string
}

/**
 * Server action: Trigger OCR/text extraction for a document.
 * Usually called automatically after upload, but can be re-triggered.
 */
export async function runOcrAction(
  objectId: string,
  versionId?: string
): Promise<OcrResult> {
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

    const result = await runOcrForVersion(
      obj.legacyTenantId,
      objectId,
      targetVersionId,
      version.mimeType || "application/octet-stream"
    )

    if (!result.ok) {
      return { success: false, error: result.error }
    }

    return { success: true, extractedLength: result.extractedLength }
  } catch (error) {
    logError(error, { operation: "runOcrAction" })
    return { success: false, error: String(error) }
  }
}

/**
 * Server action: Get extracted metadata for a document.
 */
export async function getExtractedMetadataAction(
  objectId: string
): Promise<ExtractedMetadata | null> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return null
    }

    const db = getDb()

    const [obj] = await db
      .select()
      .from(magicdriveObjects)
      .where(eq(magicdriveObjects.id, objectId))
      .limit(1)

    if (!obj) {
      return null
    }

    const [index] = await db
      .select()
      .from(magicdriveObjectIndex)
      .where(eq(magicdriveObjectIndex.objectId, objectId))
      .limit(1)

    if (!index) {
      return null
    }

    return {
      objectId,
      versionId: obj.currentVersionId || "",
      extractedText: index.extractedText,
      extractedFields: index.extractedFields as Record<string, unknown> | null,
      textHash: index.textHash,
      updatedAt: index.updatedAt?.toISOString() ?? "",
    }
  } catch (error) {
    logError(error, { operation: "getExtractedMetadataAction" })
    return null
  }
}

/**
 * Server action: Search documents by extracted text (full-text search).
 * Phase 4: Filters by organization_id when tenant context is active.
 */
export async function searchByTextAction(
  workspaceId: string,
  query: string,
  limit: number = 50,
  tenantContext?: { organizationId?: string | null; teamId?: string | null }
): Promise<{ objectId: string; title: string | null; snippet: string | null }[]> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return []
    }

    if (!query.trim()) {
      return []
    }

    // Use raw postgres.js client for full-text search with ts_headline
    const client = getDbClient()

    // Phase 4: Prefer organizationId filter, fallback to legacy tenant_id
    const orgId = tenantContext?.organizationId
    const results = orgId
      ? ((await client`
          SELECT 
            moi.object_id,
            mo.title,
            ts_headline('english', moi.extracted_text, plainto_tsquery('english', ${query}), 
              'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20') as snippet
          FROM magicdrive_object_index moi
          INNER JOIN magicdrive_objects mo ON mo.id = moi.object_id
          WHERE mo.organization_id = ${orgId}
            AND mo.deleted_at IS NULL
            AND moi.search_vector @@ plainto_tsquery('english', ${query})
          ORDER BY ts_rank(moi.search_vector, plainto_tsquery('english', ${query})) DESC
          LIMIT ${limit}
        `) as { object_id: string; title: string | null; snippet: string | null }[])
      : ((await client`
          SELECT 
            moi.object_id,
            mo.title,
            ts_headline('english', moi.extracted_text, plainto_tsquery('english', ${query}), 
              'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20') as snippet
          FROM magicdrive_object_index moi
          INNER JOIN magicdrive_objects mo ON mo.id = moi.object_id
          WHERE mo.tenant_id = ${workspaceId}
            AND mo.deleted_at IS NULL
            AND moi.search_vector @@ plainto_tsquery('english', ${query})
          ORDER BY ts_rank(moi.search_vector, plainto_tsquery('english', ${query})) DESC
          LIMIT ${limit}
        `) as { object_id: string; title: string | null; snippet: string | null }[])

    return results.map((row) => ({
      objectId: row.object_id,
      title: row.title,
      snippet: row.snippet,
    }))
  } catch (error) {
    logError(error, { operation: "searchByTextAction" })
    return []
  }
}

/**
 * Server action: Get documents with low OCR confidence (may need manual review).
 */
export async function getLowConfidenceDocumentsAction(
  workspaceId: string,
  threshold: number = 60
): Promise<{ objectId: string; title: string | null; confidence: number }[]> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return []
    }

    // Use raw postgres.js client for JSONB field access
    const client = getDbClient()

    const results = (await client`
      SELECT 
        moi.object_id,
        mo.title,
        COALESCE((moi.extracted_fields->>'ocrConfidence')::numeric, 0) as confidence
      FROM magicdrive_object_index moi
      INNER JOIN magicdrive_objects mo ON mo.id = moi.object_id
      WHERE mo.tenant_id = ${workspaceId}
        AND mo.deleted_at IS NULL
        AND (moi.extracted_fields->>'lowConfidence')::boolean = true
      ORDER BY confidence ASC
      LIMIT 100
    `) as { object_id: string; title: string | null; confidence: number }[]

    return results.map((row) => ({
      objectId: row.object_id,
      title: row.title,
      confidence: row.confidence || 0,
    }))
  } catch (error) {
    logError(error, { operation: "getLowConfidenceDocumentsAction" })
    return []
  }
}

/**
 * Server action: Update extracted fields manually (for manual metadata entry).
 */
export async function updateExtractedFieldsAction(
  objectId: string,
  fields: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
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

    const [existing] = await db
      .select()
      .from(magicdriveObjectIndex)
      .where(eq(magicdriveObjectIndex.objectId, objectId))
      .limit(1)

    if (existing) {
      // Merge with existing fields
      const mergedFields = {
        ...(existing.extractedFields as Record<string, unknown> || {}),
        ...fields,
        manuallyEdited: true,
        manualEditedAt: new Date().toISOString(),
      }

      await db
        .update(magicdriveObjectIndex)
        .set({
          extractedFields: mergedFields,
          updatedAt: new Date(),
        })
        .where(eq(magicdriveObjectIndex.objectId, objectId))
    } else {
      // Create new index entry
      const { randomUUID } = await import("node:crypto")
      await db.insert(magicdriveObjectIndex).values({
        id: randomUUID(),
        objectId,
        extractedFields: {
          ...fields,
          manuallyEdited: true,
          manualEditedAt: new Date().toISOString(),
        },
      })
    }

    return { success: true }
  } catch (error) {
    logError(error, { operation: "updateExtractedFieldsAction" })
    return { success: false, error: String(error) }
  }
}

