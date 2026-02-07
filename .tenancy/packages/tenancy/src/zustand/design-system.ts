"use client"

import { create } from "zustand"
import type { TenancyDesignSystemSettings as DesignSystemSettings } from "@afenda/tenancy/zod"
import { DEFAULT_DESIGN_SYSTEM } from "@afenda/tenancy/zod"
import { routes } from "@afenda/shared/constants"
import {
  getDesignSystemValidationErrors,
  hasDesignSystemValidationErrors,
} from "@afenda/shared/utils"

interface DesignSystemState {
  settings: DesignSystemSettings
  lastSavedSettings: DesignSystemSettings
  isLoading: boolean
  isSaving: boolean
  error: string | null
  isDirty: boolean
  autoSave: boolean

  // Actions
  setSettings: (settings: Partial<DesignSystemSettings>) => void
  fetchSettings: () => Promise<void>
  saveSettings: () => Promise<void>
  resetToDefaults: () => void
  setAutoSave: (enabled: boolean) => void
  revertToSaved: () => void
}

let autoSaveTimer: ReturnType<typeof setTimeout> | undefined

export const useDesignSystemStore = create<DesignSystemState>((set, get) => ({
  settings: DEFAULT_DESIGN_SYSTEM,
  lastSavedSettings: DEFAULT_DESIGN_SYSTEM,
  isLoading: true,
  isSaving: false,
  error: null,
  isDirty: false,
  autoSave: true,

  setSettings: (partial) => {
    set((state) => ({
      settings: { ...state.settings, ...partial },
      isDirty: true,
    }))

    const { autoSave, isLoading } = get()
    if (!autoSave || isLoading) return

    // Don't auto-save if inputs are invalid (e.g., malformed OKLCH).
    const errors = getDesignSystemValidationErrors(get().settings)
    if (hasDesignSystemValidationErrors(errors)) return

    if (autoSaveTimer) clearTimeout(autoSaveTimer)
    autoSaveTimer = setTimeout(() => {
      // Fire and forget; errors are stored in the state.
      void get().saveSettings()
    }, 800)
  },

  fetchSettings: async () => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch(routes.api.v1.tenancy.tenant.designSystem())
      if (!res.ok) throw new Error("Failed to fetch settings")
      const json = await res.json()
      const merged = { ...DEFAULT_DESIGN_SYSTEM, ...json.data?.settings }
      set({
        settings: merged,
        lastSavedSettings: merged,
        isLoading: false,
        isDirty: false,
      })
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Unknown error",
        isLoading: false,
      })
    }
  },

  saveSettings: async () => {
    const { settings } = get()
    const errors = getDesignSystemValidationErrors(settings)
    if (hasDesignSystemValidationErrors(errors)) {
      set({
        error: "Fix invalid color values before saving.",
      })
      return
    }

    set({ isSaving: true, error: null })
    try {
      const res = await fetch(routes.api.v1.tenancy.tenant.designSystem(), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error("Failed to save settings")
      set({
        isSaving: false,
        isDirty: false,
        lastSavedSettings: settings,
      })
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Unknown error",
        isSaving: false,
      })
    }
  },

  resetToDefaults: () => {
    set({
      settings: DEFAULT_DESIGN_SYSTEM,
      isDirty: true,
    })

    const { autoSave } = get()
    if (!autoSave) return
    const errors = getDesignSystemValidationErrors(DEFAULT_DESIGN_SYSTEM)
    if (hasDesignSystemValidationErrors(errors)) return
    if (autoSaveTimer) clearTimeout(autoSaveTimer)
    autoSaveTimer = setTimeout(() => {
      void get().saveSettings()
    }, 200)
  },

  setAutoSave: (enabled) => {
    set({ autoSave: enabled })
    if (!enabled && autoSaveTimer) {
      clearTimeout(autoSaveTimer)
      autoSaveTimer = undefined
    }
  },

  revertToSaved: () => {
    const { lastSavedSettings } = get()
    set({
      settings: lastSavedSettings,
      isDirty: false,
      error: null,
    })
  },
}))
