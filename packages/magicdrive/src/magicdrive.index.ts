/**
 * @afenda/magicdrive — MagicDrive Domain Package
 *
 * Document/folder management domain.
 * Provides file browser, folder hierarchy, document templates.
 *
 * @layer domain (magicdrive)
 * @dependency @afenda/shared (tags, saved-views, bulk-actions, attachments)
 */

// Zod contracts (schemas and types) — single source for shared type names
export * from "./zod";

// Zustand stores — explicit exports to avoid conflict with zod (ViewMode, SortOrder, etc.)
export {
  usemagicdriveStore,
  useDocumentHubStore,
  useSavedViewsStore,
  useThumbnailCache,
  useUploadStore,
} from "./zustand";
export type { magicdriveState, magicdriveActions } from "./zustand";

// TanStack Query hooks
export * from "./query";

// Domain constants
export * from "./constant";

// Domain hooks (useDocuments from query is canonical; hooks add options/result types)
export type { UseDocumentsOptions, UseDocumentsResult } from "./hooks/magicdrive.use-documents.hooks";
export * from "./hooks/magicdrive.use-folder-tree.hooks";
export * from "./hooks/magicdrive.use-selection.hooks";
export * from "./hooks/magicdrive.use-upload.hooks";
export * from "./hooks/magicdrive.use-preview.hooks";
export * from "./hooks/magicdrive.use-search.hooks";

// Storage adapters
export * from "./storage";

// Drizzle schemas
export * from "./drizzle";

// Server utilities
export * from "./server";

// Logger
export * from "./pino";

// Components
export * from "./component/client";
export * from "./component/server";
