/**
 * @domain magicdrive
 * @layer client
 * @responsibility Re-export magicdrive Zustand stores (UI-only, no server truth)
 */

export {
  usemagicdriveSearchStore,
  type magicdriveFilters,
  type magicdriveSortBy,
  type magicdriveSortOrder,
  type magicdriveViewMode,
  type SavedView,
} from "./magicdrive-search"

export { usemagicdriveSelectionStore } from "./magicdrive-selection"

export {
  usemagicdriveUploadStore,
  type UploadItem,
  type UploadItemStatus,
} from "./magicdrive-upload"

export { usemagicdriveDuplicatesStore } from "./magicdrive-duplicates"

export { useThumbnailCache } from "./magicdrive-thumbnail-cache"
