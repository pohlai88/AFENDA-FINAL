import type { StateCreator, StoreMutatorIdentifier } from "zustand";

/**
 * Slices Pattern Utilities
 * Following official Zustand slices pattern:
 * @see https://zustand.docs.pmnd.rs/guides/slices-pattern
 * @see https://zustand.docs.pmnd.rs/guides/advanced-typescript#slices-pattern
 * 
 * Key principles:
 * - Each slice defines its own state and actions
 * - Slices can access the full store state via get()
 * - Combine slices using spread operator
 * - Middlewares are applied to the combined store, not individual slices
 */

/**
 * Create a slice with the official Zustand pattern.
 * 
 * @example
 * ```ts
 * interface BearSlice {
 *   bears: number
 *   addBear: () => void
 *   eatFish: () => void
 * }
 * 
 * interface FishSlice {
 *   fishes: number
 *   addFish: () => void
 * }
 * 
 * type BoundStore = BearSlice & FishSlice
 * 
 * const createBearSlice: StateCreator<
 *   BoundStore,
 *   [],
 *   [],
 *   BearSlice
 * > = (set) => ({
 *   bears: 0,
 *   addBear: () => set((s) => ({ bears: s.bears + 1 })),
 *   eatFish: () => set((s) => ({ fishes: s.fishes - 1 })),
 * })
 * 
 * const createFishSlice: StateCreator<
 *   BoundStore,
 *   [],
 *   [],
 *   FishSlice
 * > = (set) => ({
 *   fishes: 0,
 *   addFish: () => set((s) => ({ fishes: s.fishes + 1 })),
 * })
 * 
 * // Combine slices
 * const useBoundStore = create<BoundStore>()((...a) => ({
 *   ...createBearSlice(...a),
 *   ...createFishSlice(...a),
 * }))
 * ```
 */

/**
 * Helper type for slice creators with devtools middleware.
 * When using devtools, add the mutator to the Mps type parameter.
 * 
 * @example
 * ```ts
 * const createBearSlice: StateCreator<
 *   BoundStore,
 *   [["zustand/devtools", never]],
 *   [],
 *   BearSlice
 * > = (set) => ({
 *   bears: 0,
 *   addBear: () => set(
 *     (s) => ({ bears: s.bears + 1 }),
 *     undefined,
 *     'bear/addBear' // devtools action name
 *   ),
 * })
 * ```
 */
export type SliceWithDevtools<TStore, TSlice> = StateCreator<
  TStore,
  [["zustand/devtools", never]],
  [],
  TSlice
>;

/**
 * Helper type for slice creators with persist middleware.
 * 
 * @example
 * ```ts
 * const createSettingsSlice: StateCreator<
 *   BoundStore,
 *   [["zustand/persist", unknown]],
 *   [],
 *   SettingsSlice
 * > = (set) => ({ ... })
 * ```
 */
export type SliceWithPersist<TStore, TSlice, TPersistedState = unknown> = StateCreator<
  TStore,
  [["zustand/persist", TPersistedState]],
  [],
  TSlice
>;

/**
 * Helper type for slice creators with multiple middlewares.
 * Order matters: devtools should be outermost.
 * 
 * @example
 * ```ts
 * // persist(devtools(...)) pattern
 * const createSlice: StateCreator<
 *   BoundStore,
 *   [["zustand/devtools", never], ["zustand/persist", unknown]],
 *   [],
 *   MySlice
 * > = (set) => ({ ... })
 * ```
 */
export type SliceWithMiddlewares<
  TStore,
  TSlice,
  Mps extends [StoreMutatorIdentifier, unknown][] = []
> = StateCreator<TStore, Mps, [], TSlice>;

// ============================================================================
// Common Slice Patterns
// ============================================================================

/**
 * Loading state slice pattern.
 * Reusable slice for async operations.
 */
export interface LoadingSlice {
  isLoading: boolean;
  error: Error | null;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  clearError: () => void;
}

export function createLoadingSlice<TStore extends LoadingSlice>(): StateCreator<
  TStore,
  [],
  [],
  LoadingSlice
> {
  return (set) => ({
    isLoading: false,
    error: null,
    setLoading: (isLoading) => set({ isLoading } as Partial<TStore>),
    setError: (error) => set({ error, isLoading: false } as Partial<TStore>),
    clearError: () => set({ error: null } as Partial<TStore>),
  });
}

/**
 * Pagination slice pattern.
 * Reusable slice for paginated data.
 */
export interface PaginationSlice {
  page: number;
  pageSize: number;
  total: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setTotal: (total: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  resetPagination: () => void;
}

export function createPaginationSlice<TStore extends PaginationSlice>(
  defaults: { page?: number; pageSize?: number; total?: number } = {}
): StateCreator<TStore, [], [], PaginationSlice> {
  const initialPage = defaults.page ?? 1;
  const initialPageSize = defaults.pageSize ?? 20;
  const initialTotal = defaults.total ?? 0;

  return (set, get) => ({
    page: initialPage,
    pageSize: initialPageSize,
    total: initialTotal,

    setPage: (page) => set({ page } as Partial<TStore>),
    setPageSize: (pageSize) => set({ pageSize, page: 1 } as Partial<TStore>),
    setTotal: (total) => set({ total } as Partial<TStore>),

    nextPage: () => {
      const state = get();
      const maxPage = Math.ceil(state.total / state.pageSize);
      if (state.page < maxPage) {
        set({ page: state.page + 1 } as Partial<TStore>);
      }
    },

    prevPage: () => {
      const state = get();
      if (state.page > 1) {
        set({ page: state.page - 1 } as Partial<TStore>);
      }
    },

    resetPagination: () =>
      set({
        page: initialPage,
        pageSize: initialPageSize,
        total: initialTotal,
      } as Partial<TStore>),
  });
}

/**
 * Modal state slice pattern.
 * Reusable slice for modal dialogs.
 */
export interface ModalSlice<TData = unknown> {
  isOpen: boolean;
  modalData: TData | null;
  openModal: (data?: TData) => void;
  closeModal: () => void;
  toggleModal: () => void;
}

export function createModalSlice<TStore extends ModalSlice<TData>, TData = unknown>(): StateCreator<
  TStore,
  [],
  [],
  ModalSlice<TData>
> {
  return (set, get) => ({
    isOpen: false,
    modalData: null as TData | null,
    openModal: (data) => set({ isOpen: true, modalData: data ?? null } as Partial<TStore>),
    closeModal: () => set({ isOpen: false, modalData: null } as Partial<TStore>),
    toggleModal: () => {
      const state = get();
      set({ isOpen: !state.isOpen } as Partial<TStore>);
    },
  });
}

/**
 * Selection state slice pattern.
 * Reusable slice for multi-select UI.
 */
export interface SelectionSlice<TId = string> {
  selectedIds: TId[];
  selectId: (id: TId) => void;
  unselectId: (id: TId) => void;
  toggleSelectId: (id: TId) => void;
  selectAll: (ids: TId[]) => void;
  clearSelection: () => void;
  isSelected: (id: TId) => boolean;
}

export function createSelectionSlice<TStore extends SelectionSlice<TId>, TId = string>(): StateCreator<
  TStore,
  [],
  [],
  SelectionSlice<TId>
> {
  return (set, get) => ({
    selectedIds: [] as TId[],

    selectId: (id) => {
      const state = get();
      if (!state.selectedIds.includes(id)) {
        set({ selectedIds: [...state.selectedIds, id] } as Partial<TStore>);
      }
    },

    unselectId: (id) => {
      const state = get();
      set({ selectedIds: state.selectedIds.filter((i) => i !== id) } as Partial<TStore>);
    },

    toggleSelectId: (id) => {
      const state = get();
      if (state.selectedIds.includes(id)) {
        set({ selectedIds: state.selectedIds.filter((i) => i !== id) } as Partial<TStore>);
      } else {
        set({ selectedIds: [...state.selectedIds, id] } as Partial<TStore>);
      }
    },

    selectAll: (ids) => set({ selectedIds: [...ids] } as unknown as Partial<TStore>),
    clearSelection: () => set({ selectedIds: [] as TId[] } as unknown as Partial<TStore>),
    isSelected: (id) => get().selectedIds.includes(id),
  });
}
