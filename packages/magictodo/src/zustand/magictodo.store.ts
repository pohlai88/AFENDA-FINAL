"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

/**
 * magictodo domain store (client-side state management).
 */

interface MagictodoState {
  // State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  isLoading: false,
  error: null,
};

export const useMagictodoStore = create<MagictodoState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        reset: () => set(initialState),
      }),
      { name: "magictodo-store" }
    ),
    { name: "MagictodoStore" }
  )
);
