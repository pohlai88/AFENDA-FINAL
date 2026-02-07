/**
 * R2 key helpers for MagicDrive object storage layout.
 */

/** Quarantine bucket key (before ingest). */
export function quarantineSourceKey(tenantId: string, uploadId: string): string {
  return `magicdrive/quarantine/${tenantId}/${uploadId}`;
}

/** Canonical source file key (after ingest). */
export function canonicalSourceKey(tenantId: string, objectId: string, versionId: string): string {
  return `magicdrive/source/${tenantId}/${objectId}/${versionId}`;
}

/** Thumbnail key. */
export function canonicalThumbKey(
  tenantId: string,
  objectId: string,
  versionId: string,
  page: number
): string {
  return `magicdrive/thumbs/${tenantId}/${objectId}/${versionId}/page-${page}.webp`;
}

/** Preview key. */
export function canonicalPreviewKey(
  tenantId: string,
  objectId: string,
  versionId: string
): string {
  return `magicdrive/preview/${tenantId}/${objectId}/${versionId}/preview.pdf`;
}

/** Extracted text key (OCR result stored in R2). */
export function canonicalTextKey(
  tenantId: string,
  objectId: string,
  versionId: string
): string {
  return `magicdrive/text/${tenantId}/${objectId}/${versionId}/text.json`;
}
