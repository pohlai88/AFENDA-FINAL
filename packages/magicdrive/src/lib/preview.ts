/**
 * @domain magicdrive
 * @layer server
 * @responsibility Generate preview: copy canonical source to preview key so presigned preview-url serves a file.
 *
 * For PDF and images we copy the source to the preview key (preview.pdf or same file).
 * Thumbnails (first page of PDF, image resize) are generated in thumbs.ts; preview-url serves the full file.
 */

import "server-only"

import { CopyObjectCommand } from "@aws-sdk/client-s3"

import {
  getR2BucketName,
  getR2Client,
  canonicalPreviewKey,
  canonicalSourceKey,
} from "@afenda/shared/r2"

export type PreviewResult =
  | { ok: true }
  | { ok: false; error: string }

/**
 * Copy canonical source to preview key so GET preview-url returns a valid file.
 * Safe to call multiple times (overwrites). Fire-and-forget from ingest.
 */
export async function runPreviewForVersion(
  tenantId: string,
  objectId: string,
  versionId: string,
  mimeType: string
): Promise<PreviewResult> {
  const bucket = getR2BucketName()
  const s3 = getR2Client()
  const sourceKey = canonicalSourceKey(tenantId, objectId, versionId)
  const previewKey = canonicalPreviewKey(tenantId, objectId, versionId)

  const copySource = `${bucket}/${sourceKey}`

  try {
    await s3.send(
      new CopyObjectCommand({
        Bucket: bucket,
        CopySource: copySource,
        Key: previewKey,
        ContentType: mimeType,
      })
    )
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Preview copy failed: ${message}` }
  }
}

