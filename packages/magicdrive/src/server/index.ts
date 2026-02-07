/**
 * @layer domain (magicdrive)
 * @responsibility Server actions/services for magicdrive domain.
 */

// Document CRUD
export * from "./magicdrive.documents.server"

// Folder CRUD
export * from "./magicdrive.folders.server"

// Tag management
export * from "./magicdrive.tags.server"

// Bulk operations
export * from "./magicdrive.bulk.server"

// Upload/download
export * from "./magicdrive.upload.server"

// Duplicate detection
export * from "./magicdrive.duplicates.server"

// Preview generation
export * from "./magicdrive.preview.server"

// OCR & metadata extraction
export * from "./magicdrive.ocr.server"

// Collections
export * from "./magicdrive.collections.server"

// Saved views
export * from "./magicdrive.saved-views.server"

// Queue processing (cron / server-only)
export { processOneMagicdriveJobFromQueue } from "../lib/jobs"
