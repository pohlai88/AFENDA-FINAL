/**
 * Shared Bulk Actions Infrastructure
 * Generic bulk operations pattern for cross-domain use.
 *
 * @domain shared
 * @layer types
 *
 * @example
 * ```ts
 * import { BulkAction, useBulkSelection } from "@afenda/shared/bulk-actions";
 * ```
 */

import type { ComponentType } from "react";

/**
 * Generic bulk action definition.
 * Domain packages provide concrete action implementations.
 */
export interface BulkAction<T = unknown> {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  description?: string;
  variant?: "default" | "destructive" | "outline";
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  execute: (items: T[]) => Promise<void>;
  isDisabled?: (items: T[]) => boolean;
  isHidden?: (items: T[]) => boolean;
}

/**
 * Bulk selection state
 */
export interface BulkSelectionState<T = unknown> {
  selectedItems: Set<string>;
  selectedData: T[];
  isAllSelected: boolean;
  isIndeterminate: boolean;
}

/**
 * Bulk selection hook return type
 */
export interface UseBulkSelectionReturn<T = unknown> {
  selectedItems: Set<string>;
  selectedData: T[];
  isAllSelected: boolean;
  isIndeterminate: boolean;
  toggleItem: (itemId: string) => void;
  toggleAll: () => void;
  clearSelection: () => void;
  isSelected: (itemId: string) => boolean;
  selectedCount: number;
}

/**
 * Bulk action toolbar props
 */
export interface BulkActionToolbarProps<T = unknown> {
  selectedItems: T[];
  actions: BulkAction<T>[];
  onActionComplete?: () => void;
  onActionError?: (error: unknown) => void;
  disabled?: boolean;
}

/**
 * Bulk action confirmation dialog props
 */
export interface BulkActionConfirmationProps<T = unknown> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: BulkAction<T> | null;
  itemCount: number;
  onConfirm: () => void;
}
