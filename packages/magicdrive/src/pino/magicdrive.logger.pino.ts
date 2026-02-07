/**
 * @layer domain (magicdrive)
 * @responsibility Domain-specific Pino logger.
 */

import pino from "pino"

/**
 * magicdrive domain logger.
 * Extends base logger with domain-specific context.
 */
export const magicdriveLogger = pino({
  name: "magicdrive",
  level: process.env.LOG_LEVEL || "info",
  base: {
    domain: "magicdrive",
  },
})

/**
 * Create a child logger with additional context.
 */
export function createmagicdriveLogger(context: Record<string, unknown>) {
  return magicdriveLogger.child(context)
}

/**
 * Log levels for common operations.
 */
export const logUpload = (data: {
  uploadId: string
  filename: string
  sizeBytes: number
  mimeType: string
}) => {
  magicdriveLogger.info({ ...data, operation: "upload" }, "File upload initiated")
}

export const logUploadComplete = (data: {
  uploadId: string
  objectId: string
  versionId: string
}) => {
  magicdriveLogger.info({ ...data, operation: "upload_complete" }, "File upload completed")
}

export const logDuplicateDetected = (data: {
  groupId: string
  reason: string
  documentCount: number
}) => {
  magicdriveLogger.info({ ...data, operation: "duplicate_detected" }, "Duplicate documents detected")
}

export const logOcrComplete = (data: {
  objectId: string
  textLength: number
  duration: number
}) => {
  magicdriveLogger.info({ ...data, operation: "ocr_complete" }, "OCR processing completed")
}

export const logClassification = (data: {
  objectId: string
  docType: string
  confidence?: number
}) => {
  magicdriveLogger.info({ ...data, operation: "classification" }, "Document classified")
}

export const logError = (error: unknown, context: Record<string, unknown>) => {
  magicdriveLogger.error({ err: error, ...context }, "magicdrive error")
}
