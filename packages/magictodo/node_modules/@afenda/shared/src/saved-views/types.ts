/**
 * Shared Saved Views Infrastructure
 * Generic filter persistence pattern for cross-domain use
 * 
 * @example
 * import { SavedView, SavedViewService } from "@afenda/shared/saved-views";
 */

/**
 * Generic saved view structure
 * TFilter is the domain-specific filter type
 */
export interface SavedView<TFilter = unknown> {
  id: string;
  name: string;
  description?: string;
  filters: TFilter;
  isDefault?: boolean;
  isShared?: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

/** Input for creating a saved view (id and createdAt are set by the service) */
export type CreateSavedViewInput<TFilter = unknown> = Omit<SavedView<TFilter>, "id" | "createdAt">;

/** Input for updating a saved view (partial) */
export type UpdateSavedViewInput<TFilter = unknown> = Partial<SavedView<TFilter>>;

/**
 * Generic saved view service interface
 * Each domain implements this for their filter types
 */
export interface SavedViewService<TFilter = unknown> {
  /**
   * List all saved views for the current user
   */
  listViews(): Promise<SavedView<TFilter>[]>;
  
  /**
   * Get a specific saved view by ID
   */
  getView(viewId: string): Promise<SavedView<TFilter> | null>;
  
  /**
   * Create a new saved view
   */
  createView(view: Omit<SavedView<TFilter>, "id" | "createdAt">): Promise<SavedView<TFilter>>;
  
  /**
   * Update an existing saved view
   */
  updateView(viewId: string, updates: Partial<SavedView<TFilter>>): Promise<SavedView<TFilter>>;
  
  /**
   * Delete a saved view
   */
  deleteView(viewId: string): Promise<void>;
  
  /**
   * Set a view as default
   */
  setDefaultView(viewId: string): Promise<void>;
}

/**
 * Saved view manager props for pure UI component
 */
export interface SavedViewManagerProps<TFilter = unknown> {
  currentFilters: TFilter;
  savedViews: SavedView<TFilter>[];
  onApplyView: (filters: TFilter) => void;
  onSaveView: (view: Omit<SavedView<TFilter>, "id" | "createdAt">) => void;
  onUpdateView: (viewId: string, updates: Partial<SavedView<TFilter>>) => void;
  onDeleteView: (viewId: string) => void;
  onSetDefault?: (viewId: string) => void;
  disabled?: boolean;
  maxViews?: number;
}

/**
 * Helper to check if filters are empty
 */
export function isFiltersEmpty(filters: unknown): boolean {
  if (!filters) return true;
  if (typeof filters !== "object") return false;
  if (Array.isArray(filters)) return filters.length === 0;
  return Object.keys(filters).length === 0;
}
