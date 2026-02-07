/**
 * @layer domain (magicdrive)
 * @responsibility Server-side lib functions for direct API route usage.
 *
 * Re-exports internal lib functions for use by API routes.
 */

// Ingest
export { finalizeIngest, type IngestResult } from "./ingest"

// List / Query
export {
  listObjects,
  listDuplicateGroups,
  getObjectById,
  dismissDuplicateGroup,
  type ListObjectsQuery,
  type ObjectWithVersion,
} from "./list"

// Tags
export {
  listTagsByTenant,
  createTag,
  deleteTag,
  addTagToObject,
  removeTagFromObject,
  listTagsForObject,
  listTagsForObjects,
  findOrCreateTagByName,
  type TagRow,
} from "./tags"

// Update / Status
export {
  updateObjectStatus,
  deleteObject,
  runBulkAction,
  type UpdateStatusResult,
  type DeleteObjectResult,
} from "./update"

// Duplicate object
export { duplicateObject, type DuplicateObjectResult } from "./duplicate-object"

// Keep best
export { setKeepBest, type KeepBestResult } from "./keep-best"

// Hash audit
export { runHashAudit, type HashAuditResult } from "./hash-audit"

// Jobs (queue processing)
export { processOneMagicdriveJobFromQueue, enqueuePostIngestJobs } from "./jobs"

// OCR
export { runOcrForVersion, type OcrResult } from "./ocr"

// Preview
export { runPreviewForVersion, type PreviewResult } from "./preview"

// Thumbs
export { runThumbnailsForVersion, type ThumbResult } from "./thumbs"

// Classify
export { suggestDocType, classify, type ClassifyInput, type ClassifyResult } from "./classify"

// Duplicates detection
export { runExactDuplicateCheck, runNearDuplicateCheck } from "./duplicates"
