/**
 * @domain magicdrive
 * @layer server
 * @responsibility Duplicate a document (object + current version) with R2 copy
 */

import "server-only"

import { CopyObjectCommand } from "@aws-sdk/client-s3"
import { and, eq } from "drizzle-orm"
import { randomUUID } from "node:crypto"

import { getDb, magicdriveObjectVersions, magicdriveObjects } from "@afenda/shared/db"
import { getR2BucketName, getR2Client, canonicalSourceKey } from "@afenda/shared/r2"

export type DuplicateObjectResult =
  | { ok: true; objectId: string; versionId: string }
  | { ok: false; error: string }

export async function duplicateObject(
  tenantId: string,
  ownerId: string,
  objectId: string
): Promise<DuplicateObjectResult> {
  const db = getDb()

  const [row] = await db
    .select({
      objectTitle: magicdriveObjects.title,
      docType: magicdriveObjects.docType,
      versionR2Key: magicdriveObjectVersions.r2Key,
      versionMimeType: magicdriveObjectVersions.mimeType,
      versionSizeBytes: magicdriveObjectVersions.sizeBytes,
      versionSha256: magicdriveObjectVersions.sha256,
    })
    .from(magicdriveObjects)
    .innerJoin(
      magicdriveObjectVersions,
      eq(magicdriveObjects.currentVersionId, magicdriveObjectVersions.id)
    )
    .where(
      and(
        eq(magicdriveObjects.id, objectId),
        eq(magicdriveObjects.tenantId, tenantId)
      )
    )
    .limit(1)

  if (!row?.versionR2Key) return { ok: false, error: "Object or version not found" }

  const newObjectId = randomUUID()
  const newVersionId = randomUUID()
  const newKey = canonicalSourceKey(tenantId, newObjectId, newVersionId)
  const bucket = getR2BucketName()
  const s3 = getR2Client()
  const copySource = `${bucket}/${row.versionR2Key}`

  try {
    await s3.send(
      new CopyObjectCommand({
        Bucket: bucket,
        CopySource: copySource,
        Key: newKey,
        ContentType: row.versionMimeType,
      })
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `R2 copy failed: ${message}` }
  }

  const title = row.objectTitle ? `${row.objectTitle} (copy)` : "Copy"

  await db.insert(magicdriveObjects).values({
    id: newObjectId,
    tenantId: tenantId,
    teamId: tenantId,
    ownerId,
    currentVersionId: newVersionId,
    title,
    docType: row.docType,
    status: "inbox",
  })

  await db.insert(magicdriveObjectVersions).values({
    id: newVersionId,
    objectId: newObjectId,
    versionNo: 1,
    r2Key: newKey,
    mimeType: row.versionMimeType,
    sizeBytes: row.versionSizeBytes,
    sha256: row.versionSha256,
    tenantId,
    teamId: tenantId,
  })

  return { ok: true, objectId: newObjectId, versionId: newVersionId }
}

