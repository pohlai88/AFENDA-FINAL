/**
 * MagicDrive domain constants (shared between magicdrive package and API routes).
 */

export const STATUS = {
  INBOX: "inbox",
  ACTIVE: "ready", // alias for compatibility
  PROCESSING: "processing",
  READY: "ready",
  ARCHIVED: "archived",
  DELETED: "deleted", // soft-delete (distinct from archived for UI keys)
  ERROR: "error",
} as const;

export const UPLOAD_STATUS = {
  PRESIGNED: "presigned",
  UPLOADED: "uploaded",
  INGESTED: "ingested",
  FAILED: "failed",
} as const;

export const DUP_REASON = {
  EXACT: "exact",
  NEAR: "near",
} as const;

export const DOC_TYPE = {
  PDF: "pdf",
  IMAGE: "image",
  DOCUMENT: "document",
  SPREADSHEET: "spreadsheet",
  PRESENTATION: "presentation",
  ARCHIVE: "archive",
  VIDEO: "video",
  AUDIO: "audio",
  OTHER: "other",
  // Aliases for magicdrive zod compatibility
  INVOICE: "document",
  CONTRACT: "document",
  RECEIPT: "document",
} as const;

/** Union of all document type values */
export type DocTypeValue = (typeof DOC_TYPE)[keyof typeof DOC_TYPE];

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "text/markdown",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/zip",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
] as const;

export const MAX_FILE_BYTES = 100 * 1024 * 1024; // 100MB

export const SHA256_HEX_LENGTH = 64;
