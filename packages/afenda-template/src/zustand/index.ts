/**
 * Zustand Stage - Best Practices Implementation
 * Following official Zustand documentation:
 * @see https://zustand.docs.pmnd.rs/guides/advanced-typescript
 * @see https://zustand.docs.pmnd.rs/guides/nextjs
 * @see https://zustand.docs.pmnd.rs/guides/slices-pattern
 */

// Core types and utilities
export * from "./_zustand.types";

// Store creation (Next.js compatible)
export * from "./_zustand.store";

// Slices pattern utilities
export * from "./_zustand.slices";

// Persistence utilities
export * from "./_zustand.persist";

// Testing utilities
export * from "./_zustand.testing";

// Re-export commonly used zustand utilities
export { create } from "zustand";
export { createStore } from "zustand/vanilla";
export { useStore } from "zustand";
export {
  devtools,
  persist,
  subscribeWithSelector,
  combine,
  createJSONStorage,
} from "zustand/middleware";
export type {
  StateCreator,
  StoreApi,
  StoreMutatorIdentifier,
  UseBoundStore,
} from "zustand";
export type { PersistOptions, PersistStorage, StateStorage } from "zustand/middleware";

// Shallow comparison for selectors
export { shallow } from "zustand/shallow";
