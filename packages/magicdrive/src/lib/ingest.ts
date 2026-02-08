/**
 * @domain magicdrive
 * @layer server
 * @responsibility Finalize upload: copy quarantine → canonical, create object/version, exact-dupe check
 */

import "server-only"

import { CopyObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3"
import { eq } from "drizzle-orm"

import { UPLOAD_STATUS } from "@afenda/shared/constants/magicdrive"
import {
  getDb,
  magicdriveObjectVersions,
  magicdriveObjects,
  magicdriveUploads,
} from "@afenda/shared/db"
import { getR2BucketName, getR2Client, canonicalSourceKey } from "@afenda/shared/r2"
import { suggestDocType } from "./classify"
import { runExactDuplicateCheck } from "./duplicates"
import { enqueuePostIngestJobs } from "./jobs"

export type IngestResult =
  | { ok: true; objectId: string; versionId: string; duplicateGroupId?: string }
  | { ok: false; error: string }

export async function finalizeIngest(
  uploadId: string,
  tenantId: string,
  ownerId: string,
  tenantContext?: { organizationId?: string | null; teamId?: string | null }
): Promise<IngestResult> {
  const db = getDb()

  const [upload] = await db
    .select()
    .from(magicdriveUploads)
    .where(eq(magicdriveUploads.id, uploadId))
    .limit(1)

  if (!upload) {
    return { ok: false, error: "Upload not found" }
  }
  if (upload.legacyTenantId !== tenantId || upload.ownerId !== ownerId) {
    return { ok: false, error: "Forbidden" }
  }
  if (upload.status !== UPLOAD_STATUS.PRESIGNED && upload.status !== UPLOAD_STATUS.UPLOADED) {
    return { ok: false, error: `Invalid upload status: ${upload.status}` }
  }

  const objectId = upload.objectId
  const versionId = upload.versionId
  const canonicalKey = canonicalSourceKey(tenantId, objectId, versionId)
  const bucket = getR2BucketName()
  const s3 = getR2Client()

  // Verify quarantine object exists and size matches before copy
  try {
    const head = await s3.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: upload.r2KeyQuarantine,
      })
    )
    const remoteSize = Number(head.ContentLength ?? 0)
    if (remoteSize !== upload.sizeBytes) {
      await db
        .update(magicdriveUploads)
        .set({ status: UPLOAD_STATUS.FAILED })
        .where(eq(magicdriveUploads.id, uploadId))
      return { ok: false, error: "Size mismatch: object in R2 does not match declared size" }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await db
      .update(magicdriveUploads)
      .set({ status: UPLOAD_STATUS.FAILED })
      .where(eq(magicdriveUploads.id, uploadId))
    return { ok: false, error: `Quarantine object not found or inaccessible: ${message}` }
  }

  try {
    // Copy quarantine → canonical (R2/S3 CopyObject)
    const copySource = `${bucket}/${upload.r2KeyQuarantine}`
    await s3.send(
      new CopyObjectCommand({
        Bucket: bucket,
        CopySource: copySource,
        Key: canonicalKey,
        ContentType: upload.mimeType,
      })
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await db
      .update(magicdriveUploads)
      .set({ status: UPLOAD_STATUS.FAILED })
      .where(eq(magicdriveUploads.id, uploadId))
    return { ok: false, error: `Copy failed: ${message}` }
  }

  const suggestedDocType = suggestDocType({
    title: upload.filename,
    filename: upload.filename,
  })

  await db.insert(magicdriveObjects).values({
    id: objectId,
    legacyTenantId: tenantId,
    organizationId: tenantContext?.organizationId ?? null,
    teamId: tenantContext?.teamId ?? null,
    ownerId,
    currentVersionId: versionId,
    title: upload.filename,
    docType: suggestedDocType,
    status: "inbox",
  })

  await db.insert(magicdriveObjectVersions).values({
    id: versionId,
    objectId,
    versionNo: 1,
    r2Key: canonicalKey,
    mimeType: upload.mimeType,
    sizeBytes: upload.sizeBytes,
    sha256: upload.sha256,
  })

  await db
    .update(magicdriveObjects)
    .set({ currentVersionId: versionId, updatedAt: new Date() })
    .where(eq(magicdriveObjects.id, objectId))

  // Exact duplicate check (same tenantId + sha256)
  const duplicateGroupId = await runExactDuplicateCheck(db, tenantId, versionId, upload.sha256)

  await db
    .update(magicdriveUploads)
    .set({ status: UPLOAD_STATUS.INGESTED })
    .where(eq(magicdriveUploads.id, uploadId))

  enqueuePostIngestJobs(tenantId, objectId, versionId, upload.mimeType)

  return {
    ok: true,
    objectId,
    versionId,
    duplicateGroupId: duplicateGroupId ?? undefined,
  }
}
