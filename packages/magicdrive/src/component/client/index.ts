/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Optimized component exports for magicdrive domain
 * 
 * Architecture:
 * - Core Components: Main UI components for document management
 * - Mobile Components: Mobile-specific optimizations and components
 * - Utilities: Helper functions and types
 */

// ============================================================================
// CORE COMPONENTS
// ============================================================================

/**
 * Main document hub interface - unified replacement for multiple sections
 * Features: Smart filtering, mobile-first design, bulk operations, real-time updates
 */
export { DocumentHub } from './document-hub/document-hub'

/**
 * Enhanced document card with selection, preview, and metadata display
 * Features: Multiple view modes, mobile optimization, status indicators
 */
export { EnhancedDocumentCard } from './document-card/enhanced-document-card'

/**
 * Intelligent filtering system with AI-powered suggestions
 * Features: Quick filters, advanced search, mobile-optimized interface
 */
export { SmartFilters } from './smart-filters/smart-filters'

/**
 * Document preview component with support for multiple file types
 * Features: PDF viewer, image preview, metadata display, download/share actions
 */
export { DocumentPreview } from './document-preview/document-preview'

/**
 * File upload zone with drag-and-drop and progress tracking
 * Features: Multiple file upload, progress indicators, file validation
 */
export { UploadZone } from './upload-zone/upload-zone'

/**
 * Bulk operations component for selected documents
 * Features: Archive, tag, process, share operations with mobile support
 */
export { BulkActions } from './bulk-actions/bulk-actions'

/**
 * Table view for documents using shadcn Table components
 * Features: Sortable columns, bulk selection, responsive design
 */
export { DocumentTable } from './document-table/document-table'

/**
 * Gallery view for documents using shadcn Card components
 * Features: Masonry layout, hover effects, bulk selection, responsive grid
 */
export { DocumentGallery } from './document-gallery/document-gallery'

/**
 * Relationship view - Document network map and connection visualization
 * Features: Interactive graph, relationship clustering, connection paths, network analysis
 */
export { RelationshipView } from './relationship-view/relationship-view'

/**
 * Duplicate groups view - list groups, show documents in selected group
 */
export { DuplicateGroupsView } from './duplicate-groups-view/duplicate-groups-view'

// ============================================================================
// SHARED UTILITIES
// ============================================================================

/**
 * Standardized document actions and dropdown functionality
 * Features: Consistent actions across all views, proper error handling, loading states
 */
export { DocumentActionHandler, useDocumentAction } from './utils/document-actions'
export type { DocumentAction } from './utils/document-actions'

/**
 * Standardized document actions dropdown component
 * Features: Consistent UI, loading states, configurable actions, accessibility
 */
export {
    DocumentActionsDropdown,
    DocumentActionsDropdownMinimal,
    DocumentActionsDropdownExtended,
    DocumentActionsDropdownWithDelete
} from './ui/document-actions-dropdown'

// ============================================================================
// MOBILE COMPONENTS
// ============================================================================

/**
 * Mobile-specific action bar for document management
 * Features: Touch gestures, bottom sheet, mobile-optimized controls
 */
export {
    MobileActionBar,
    MobileQuickActions,
    MobileFilterSheet,
    MobileSearchBar,
    MobileUploadButton,
    MobileStatsCard,
} from './mobile-components/mobile-components'

// ============================================================================
// UI UTILITIES
// ============================================================================

/**
 * Error boundary for magicdrive components
 * Prevents errors from cascading and crashing the entire page
 */
export {
  MagicdriveErrorBoundary,
  magicdriveErrorBoundary,
  withMagicdriveErrorBoundary,
  withmagicdriveErrorBoundary,
} from './ui/error-boundary'

/**
 * Formatting: use date-fns or implement locally.
 * Shared utils do not export formatFileSize/formatDate/formatTime; avoid re-exporting non-existent symbols.
 */

// ============================================================================
// RE-EXPORTS (stores only — types from @afenda/magicdrive/zustand to avoid barrel conflicts)
// ============================================================================
export { useThumbnailCache, useSavedViewsStore } from "@afenda/magicdrive/zustand"

// ============================================================================
// BARREL EXPORT OPTIMIZATION
// ============================================================================

/**
 * Tree-shaking friendly exports
 * 
 * This barrel file is optimized for:
 * - Tree-shaking: Unused components are eliminated from bundle
 * - Type safety: Full TypeScript support with proper exports
 * - Documentation: Clear component descriptions and purposes
 * - Organization: Logical grouping by functionality and platform
 * 
 * Usage examples:
 * 
 * ```typescript
 * // Import specific components (tree-shakable)
 * import { DocumentHub, SmartFilters } from '@/components/magicdrive'
 * 
 * // Import mobile components
 * import { MobileActionBar, MobileUploadButton } from '@/components/magicdrive'
 * 
 * // Import utilities
 * import { formatFileSize, formatDate } from '@/components/magicdrive'
 * 
 * // Use error boundary
 * import { magicdriveErrorBoundary } from '@/components/magicdrive'
 * 
 * // Import types
 * import type { ViewMode, SortBy } from '@/components/magicdrive'
 * ```
 */
