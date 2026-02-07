/**
 * @layer domain (magicdrive)
 * @responsibility Domain constants and configuration.
 */

/**
 * Supported file types for upload.
 */
export const SUPPORTED_FILE_TYPES = {
  documents: [
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
  ],
  images: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ],
  archives: [
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
  ],
} as const

/**
 * Max file size in bytes (100MB).
 */
export const MAX_FILE_SIZE = 100 * 1024 * 1024

/**
 * Max folder depth.
 */
export const MAX_FOLDER_DEPTH = 10;

/**
 * List API pagination (drive list, document list).
 */
export const LIST_LIMIT = {
  DEFAULT: 50,
  MAX: 100,
} as const;

/**
 * Default sort configurations.
 */
export const DEFAULT_SORT = {
  field: "name" as const,
  order: "asc" as const,
}

/**
 * Document type icons mapping.
 */
export const DOCUMENT_TYPE_ICONS = {
  file: "file",
  note: "file-text",
  template: "file-code",
  link: "link",
  shortcut: "external-link",
} as const

/**
 * Folder colors.
 */
export const FOLDER_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
] as const
