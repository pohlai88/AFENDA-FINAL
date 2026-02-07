/**
 * @layer domain (magicdrive)
 * @responsibility Upload server actions (presigned URLs, finalize).
 *
 * Wires to lib/server/magicdrive/ingest.ts and R2 presigned URLs.
 */

"use server"

import { revalidatePath } from "next/cache"
import { logError } from "../pino"
import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"

import {
  getDb,
  magicdriveUploads,
  magicdriveObjects,
  magicdriveObjectVersions,
} from "@afenda/shared/db"
import {
  getR2Client,
  getR2BucketName,
  isR2Configured,
  quarantineSourceKey,
  canonicalSourceKey,
  canonicalThumbKey,
} from "@afenda/shared/r2"
import { routes } from "@afenda/shared/constants"
import { UPLOAD_STATUS } from "@afenda/shared/constants/magicdrive"
import { finalizeIngest } from "../lib/ingest"
import { getAuthContext } from "@afenda/auth/server"

export interface PresignedUploadResponse {
  uploadId: string
  objectId: string
  versionId: string
  presignedUrl: string
  expiresAt: string
}

export interface FinalizeUploadResponse {
  success: boolean
  objectId?: string
  versionId?: string
  duplicateGroupId?: string
  error?: string
}

/** Presigned URL expiry (1 hour) */
const PRESIGNED_EXPIRY_SECONDS = 3600

/**
 * Server action: Request presigned URL for file upload.
 */
export async function requestPresignedUploadAction(params: {
  workspaceId: string
  filename: string
  mimeType: string
  sizeBytes: number
  sha256?: string
}): Promise<{ success: boolean; upload?: PresignedUploadResponse; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return { success: false, error: "Unauthorized" }
    }

    if (!isR2Configured()) {
      return { success: false, error: "R2 storage not configured" }
    }

    const db = getDb()
    const s3 = getR2Client()
    const bucket = getR2BucketName()

    const uploadId = randomUUID()
    const objectId = randomUUID()
    const versionId = randomUUID()
    const tenantId = params.workspaceId
    const ownerId = auth.userId

    const quarantineKey = quarantineSourceKey(tenantId, uploadId)

    // Generate presigned PUT URL
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: quarantineKey,
      ContentType: params.mimeType,
      ContentLength: params.sizeBytes,
    })

    const presignedUrl = await getSignedUrl(s3, command, {
      expiresIn: PRESIGNED_EXPIRY_SECONDS,
    })

    const expiresAt = new Date(Date.now() + PRESIGNED_EXPIRY_SECONDS * 1000).toISOString()

    // Create upload record
    // Note: sha256 can be empty if client doesn't compute it before upload;
    // it will be computed server-side during finalize
    await db.insert(magicdriveUploads).values({
      id: uploadId,
      tenantId,
      ownerId,
      objectId,
      versionId,
      filename: params.filename,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
      sha256: params.sha256 || "",
      r2KeyQuarantine: quarantineKey,
      status: UPLOAD_STATUS.PRESIGNED,
    })

    return {
      success: true,
      upload: {
        uploadId,
        objectId,
        versionId,
        presignedUrl,
        expiresAt,
      },
    }
  } catch (error) {
    logError(error, { operation: "requestPresignedUploadAction" })
    return { success: false, error: String(error) }
  }
}

/**
 * Server action: Finalize upload after client completes upload to presigned URL.
 */
export async function finalizeUploadAction(
  uploadId: string
): Promise<FinalizeUploadResponse> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return { success: false, error: "Unauthorized" }
    }

    const db = getDb()

    // Get upload record to verify ownership
    const [upload] = await db
      .select()
      .from(magicdriveUploads)
      .where(eq(magicdriveUploads.id, uploadId))
      .limit(1)

    if (!upload) {
      return { success: false, error: "Upload not found" }
    }

    if (upload.ownerId !== auth.userId) {
      return { success: false, error: "Forbidden" }
    }

    // Call the actual ingest service
    const result = await finalizeIngest(uploadId, upload.tenantId, auth.userId)

    if (!result.ok) {
      return { success: false, error: result.error }
    }

    revalidatePath(routes.ui.magicdrive.root())

    return {
      success: true,
      objectId: result.objectId,
      versionId: result.versionId,
      duplicateGroupId: result.duplicateGroupId,
    }
  } catch (error) {
    logError(error, { operation: "finalizeUploadAction" })
    return { success: false, error: String(error) }
  }
}

/**
 * Server action: Cancel an in-progress upload.
 */
export async function cancelUploadAction(
  uploadId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return { success: false, error: "Unauthorized" }
    }

    const db = getDb()

    const [upload] = await db
      .select()
      .from(magicdriveUploads)
      .where(eq(magicdriveUploads.id, uploadId))
      .limit(1)

    if (!upload) {
      return { success: false, error: "Upload not found" }
    }

    if (upload.ownerId !== auth.userId) {
      return { success: false, error: "Forbidden" }
    }

    // Delete from quarantine if exists
    if (upload.r2KeyQuarantine && isR2Configured()) {
      try {
        const s3 = getR2Client()
        const bucket = getR2BucketName()
        await s3.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: upload.r2KeyQuarantine,
          })
        )
      } catch {
        // Ignore - may not exist yet
      }
    }

    // Update status
    await db
      .update(magicdriveUploads)
      .set({ status: UPLOAD_STATUS.FAILED /* cancelled UX; DB enum has no cancelled */ })
      .where(eq(magicdriveUploads.id, uploadId))

    return { success: true }
  } catch (error) {
    logError(error, { operation: "cancelUploadAction" })
    return { success: false, error: String(error) }
  }
}

/**
 * Server action: Request download URL for a document.
 */
export async function requestDownloadUrlAction(
  objectId: string,
  versionId?: string
): Promise<{ success: boolean; url?: string; filename?: string; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return { success: false, error: "Unauthorized" }
    }

    if (!isR2Configured()) {
      return { success: false, error: "R2 storage not configured" }
    }

    const db = getDb()

    // Get object
    const [obj] = await db
      .select()
      .from(magicdriveObjects)
      .where(eq(magicdriveObjects.id, objectId))
      .limit(1)

    if (!obj) {
      return { success: false, error: "Document not found" }
    }

    // Use specified version or current version
    const targetVersionId = versionId || obj.currentVersionId
    if (!targetVersionId) {
      return { success: false, error: "No version available" }
    }

    // Get version details
    const [version] = await db
      .select()
      .from(magicdriveObjectVersions)
      .where(eq(magicdriveObjectVersions.id, targetVersionId))
      .limit(1)

    if (!version) {
      return { success: false, error: "Version not found" }
    }

    const s3 = getR2Client()
    const bucket = getR2BucketName()
    const sourceKey = canonicalSourceKey(obj.tenantId, objectId, targetVersionId)

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: sourceKey,
      ResponseContentDisposition: `attachment; filename="${obj.title || "document"}"`,
    })

    const url = await getSignedUrl(s3, command, {
      expiresIn: PRESIGNED_EXPIRY_SECONDS,
    })

    return {
      success: true,
      url,
      filename: obj.title || "document",
    }
  } catch (error) {
    logError(error, { operation: "requestDownloadUrlAction" })
    return { success: false, error: String(error) }
  }
}

/**
 * Server action: Upload new version of existing document.
 */
export async function uploadNewVersionAction(params: {
  objectId: string
  filename: string
  mimeType: string
  sizeBytes: number
  sha256?: string
}): Promise<{ success: boolean; upload?: PresignedUploadResponse; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return { success: false, error: "Unauthorized" }
    }

    if (!isR2Configured()) {
      return { success: false, error: "R2 storage not configured" }
    }

    const db = getDb()

    // Get existing object
    const [obj] = await db
      .select()
      .from(magicdriveObjects)
      .where(eq(magicdriveObjects.id, params.objectId))
      .limit(1)

    if (!obj) {
      return { success: false, error: "Document not found" }
    }

    const s3 = getR2Client()
    const bucket = getR2BucketName()

    const uploadId = randomUUID()
    const versionId = randomUUID()
    const tenantId = obj.tenantId
    const quarantineKey = quarantineSourceKey(tenantId, uploadId)

    // Generate presigned PUT URL
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: quarantineKey,
      ContentType: params.mimeType,
      ContentLength: params.sizeBytes,
    })

    const presignedUrl = await getSignedUrl(s3, command, {
      expiresIn: PRESIGNED_EXPIRY_SECONDS,
    })

    const expiresAt = new Date(Date.now() + PRESIGNED_EXPIRY_SECONDS * 1000).toISOString()

    // Create upload record (linked to existing object)
    await db.insert(magicdriveUploads).values({
      id: uploadId,
      tenantId,
      ownerId: auth.userId,
      objectId: params.objectId,
      versionId,
      filename: params.filename,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
      sha256: params.sha256 || "",
      r2KeyQuarantine: quarantineKey,
      status: UPLOAD_STATUS.PRESIGNED,
    })

    return {
      success: true,
      upload: {
        uploadId,
        objectId: params.objectId,
        versionId,
        presignedUrl,
        expiresAt,
      },
    }
  } catch (error) {
    logError(error, { operation: "uploadNewVersionAction" })
    return { success: false, error: String(error) }
  }
}

/**
 * Server action: Get preview URL for a document.
 */
export async function requestPreviewUrlAction(
  objectId: string,
  versionId?: string
): Promise<{ success: boolean; url?: string; mimeType?: string; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return { success: false, error: "Unauthorized" }
    }

    if (!isR2Configured()) {
      return { success: false, error: "R2 storage not configured" }
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

    const s3 = getR2Client()
    const bucket = getR2BucketName()
    const sourceKey = canonicalSourceKey(obj.tenantId, objectId, targetVersionId)

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: sourceKey,
    })

    const url = await getSignedUrl(s3, command, {
      expiresIn: PRESIGNED_EXPIRY_SECONDS,
    })

    return {
      success: true,
      url,
      mimeType: version.mimeType || undefined,
    }
  } catch (error) {
    logError(error, { operation: "requestPreviewUrlAction" })
    return { success: false, error: String(error) }
  }
}

/**
 * Server action: Get thumbnail URL for a document.
 */
export async function requestThumbnailUrlAction(
  objectId: string,
  page: number = 1,
  versionId?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const auth = await getAuthContext()
    if (!auth?.userId) {
      return { success: false, error: "Unauthorized" }
    }

    if (!isR2Configured()) {
      return { success: false, error: "R2 storage not configured" }
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

    const s3 = getR2Client()
    const bucket = getR2BucketName()
    const thumbKey = canonicalThumbKey(obj.tenantId, objectId, targetVersionId, page)

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: thumbKey,
    })

    const url = await getSignedUrl(s3, command, {
      expiresIn: PRESIGNED_EXPIRY_SECONDS,
    })

    return { success: true, url }
  } catch (error) {
    logError(error, { operation: "requestThumbnailUrlAction" })
    return { success: false, error: String(error) }
  }
}

