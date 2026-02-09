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
 * Folder colors (hex for storage/API). For theme-aware UI use var(--primary) as default
 * when no color is selected; optional palette tokens --palette-1 … --palette-10 in globals.css.
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

/**
 * Shared file size formatter — single source of truth for all components.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

/**
 * Shared date formatter for compact display.
 */
export function formatCompactDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  })
}

/**
 * Status configuration for consistent badge rendering across all views.
 * Used by EnhancedDocumentCard, DocumentTable, DocumentGallery, RelationshipView, etc.
 */
export const STATUS_CONFIG = {
  needs_review: {
    color: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
    label: "Needs Review",
  },
  processed: {
    color: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
    label: "Processed",
  },
  duplicates: {
    color: "bg-destructive/10 text-destructive border-destructive/30",
    label: "Duplicate",
  },
  inbox: {
    color: "bg-primary/10 text-primary border-primary/30",
    label: "Inbox",
  },
  active: {
    color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
    label: "Active",
  },
  archived: {
    color: "bg-muted text-muted-foreground border-muted",
    label: "Archived",
  },
  error: {
    color: "bg-destructive/10 text-destructive border-destructive/30",
    label: "Error",
  },
  // Aliases for STATUS enum values (STATUS.ACTIVE = "ready", STATUS.DELETED = "deleted")
  ready: {
    color: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
    label: "Active",
  },
  deleted: {
    color: "bg-destructive/10 text-destructive border-destructive/30",
    label: "Deleted",
  },
} as const

export type StatusConfigKey = keyof typeof STATUS_CONFIG
