"use client";

/**
 * Template CRUD Operations Hook
 * Comprehensive Create, Read, Update, Delete, Archive, and Draft functionality
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { routes } from "@afenda/shared/constants";
import { logger } from "@afenda/shared";

import type { ConfigTemplate } from "@afenda/orchestra/zod";

interface CRUDState {
  isLoading: boolean;
  error: string | null;
  lastOperation: string | null;
}

interface DraftState {
  drafts: Record<string, TemplateDraft>;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
}

interface TemplateDraft {
  id: string;
  template: Partial<ConfigTemplate>;
  values: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  mode: "create" | "edit" | "clone";
}

export function useTemplateCRUD() {
  const router = useRouter();
  const [crudState, setCrudState] = React.useState<CRUDState>({
    isLoading: false,
    error: null,
    lastOperation: null,
  });

  const [draftState, setDraftState] = React.useState<DraftState>({
    drafts: {},
    hasUnsavedChanges: false,
    lastSaved: null,
  });

  // Load drafts from localStorage on mount
  React.useEffect(() => {
    try {
      const savedDrafts = localStorage.getItem("template-drafts");
      if (savedDrafts) {
        const drafts = JSON.parse(savedDrafts);
        setDraftState(prev => ({
          ...prev,
          drafts: drafts,
        }));
      }
    } catch (error) {
      // Log error in development only
      if (process.env.NODE_ENV === 'development') {
         
        logger.error("Failed to load drafts", error as Error, { component: "useTemplateCRUD" });
      }
    }
  }, []);

  // Save drafts to localStorage
  const saveDraftsToStorage = React.useCallback((drafts: Record<string, TemplateDraft>) => {
    try {
      localStorage.setItem("template-drafts", JSON.stringify(drafts));
    } catch (error) {
      // Log error in development only
      if (process.env.NODE_ENV === 'development') {
         
        logger.error("Failed to save drafts to storage", error as Error, { component: "useTemplateCRUD" });
      }
    }
  }, []);

  // Create new template
  const createTemplate = React.useCallback(async (
    templateData: Omit<ConfigTemplate, "id"> & { id?: string }
  ) => {
    setCrudState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(routes.api.orchestra.configTemplatesOps("create-custom"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData),
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error?.message || "Failed to create template");
      }

      // Clear draft for this template if exists
      const templateId = templateData.id || result.data.id;
      setDraftState(prev => {
        const newDrafts = { ...prev.drafts };
        delete newDrafts[templateId];
        saveDraftsToStorage(newDrafts);
        return {
          ...prev,
          drafts: newDrafts,
          hasUnsavedChanges: Object.keys(newDrafts).length > 0,
        };
      });

      toast.success("Template created successfully", {
        description: `"${templateData.name}" is now available`,
      });

      setCrudState(prev => ({
        ...prev,
        isLoading: false,
        lastOperation: "create",
      }));

      router.refresh();
      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create template";
      setCrudState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast.error("Failed to create template", {
        description: errorMessage,
      });
      throw error;
    }
  }, [router, saveDraftsToStorage]);

  // Update existing template
  const updateTemplate = React.useCallback(async (
    templateId: string,
    templateData: Partial<ConfigTemplate>
  ) => {
    setCrudState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(routes.api.orchestra.configTemplatesOps("update-custom"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: templateId, ...templateData }),
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error?.message || "Failed to update template");
      }

      // Clear draft for this template
      setDraftState(prev => {
        const newDrafts = { ...prev.drafts };
        delete newDrafts[templateId];
        saveDraftsToStorage(newDrafts);
        return {
          ...prev,
          drafts: newDrafts,
          hasUnsavedChanges: Object.keys(newDrafts).length > 0,
        };
      });

      toast.success("Template updated successfully", {
        description: `"${templateData.name}" has been updated`,
      });

      setCrudState(prev => ({
        ...prev,
        isLoading: false,
        lastOperation: "update",
      }));

      router.refresh();
      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update template";
      setCrudState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast.error("Failed to update template", {
        description: errorMessage,
      });
      throw error;
    }
  }, [router, saveDraftsToStorage]);

  // Clone template
  const cloneTemplate = React.useCallback(async (
    sourceTemplateId: string,
    newTemplateData: Omit<ConfigTemplate, "id"> & { id: string }
  ) => {
    setCrudState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Clone is just creating a new template with copied data
      const response = await fetch(routes.api.orchestra.configTemplatesOps("create-custom"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTemplateData),
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error?.message || "Failed to clone template");
      }

      toast.success("Template cloned successfully", {
        description: `"${newTemplateData.name}" has been created`,
      });

      setCrudState(prev => ({
        ...prev,
        isLoading: false,
        lastOperation: "clone",
      }));

      router.refresh();
      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to clone template";
      setCrudState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast.error("Failed to clone template", {
        description: errorMessage,
      });
      throw error;
    }
  }, [router]);

  // Archive template (instead of delete for immutable templates)
  const archiveTemplate = React.useCallback(async (templateId: string) => {
    setCrudState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(routes.api.orchestra.configTemplatesOps("archive"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: templateId, action: "archive" }),
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error?.message || "Failed to archive template");
      }

      toast.success("Template archived successfully", {
        description: "The template has been moved to archive and can be restored later",
      });

      setCrudState(prev => ({
        ...prev,
        isLoading: false,
        lastOperation: "archive",
      }));

      router.refresh();
      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to archive template";
      setCrudState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast.error("Failed to archive template", {
        description: errorMessage,
      });
      throw error;
    }
  }, [router]);

  // Restore archived template
  const restoreTemplate = React.useCallback(async (templateId: string) => {
    setCrudState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(routes.api.orchestra.configTemplatesOps("archive"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: templateId, action: "restore" }),
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error?.message || "Failed to restore template");
      }

      toast.success("Template restored successfully", {
        description: "The template has been moved back to active templates",
      });

      setCrudState(prev => ({
        ...prev,
        isLoading: false,
        lastOperation: "restore",
      }));

      router.refresh();
      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to restore template";
      setCrudState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast.error("Failed to restore template", {
        description: errorMessage,
      });
      throw error;
    }
  }, [router]);

  // Save draft
  const saveDraft = React.useCallback((
    templateId: string,
    templateData: Partial<ConfigTemplate>,
    values: Record<string, unknown>,
    mode: "create" | "edit" | "clone"
  ) => {
    const draft: TemplateDraft = {
      id: templateId,
      template: templateData,
      values,
      createdAt: new Date(),
      updatedAt: new Date(),
      mode,
    };

    setDraftState(prev => {
      const newDrafts = { ...prev.drafts, [templateId]: draft };
      saveDraftsToStorage(newDrafts);
      return {
        ...prev,
        drafts: newDrafts,
        hasUnsavedChanges: true,
        lastSaved: new Date(),
      };
    });

    toast.success("Draft saved", {
      description: `Template "${templateData.name}" saved as draft`,
    });
  }, [saveDraftsToStorage]);

  // Load draft
  const loadDraft = React.useCallback((templateId: string) => {
    const draft = draftState.drafts[templateId];
    if (!draft) return null;

    toast.info("Draft loaded", {
      description: `Last saved: ${draft.updatedAt.toLocaleString()}`,
    });

    return draft;
  }, [draftState.drafts]);

  // Delete draft
  const deleteDraft = React.useCallback((templateId: string) => {
    setDraftState(prev => {
      const newDrafts = { ...prev.drafts };
      delete newDrafts[templateId];
      saveDraftsToStorage(newDrafts);
      return {
        ...prev,
        drafts: newDrafts,
        hasUnsavedChanges: Object.keys(newDrafts).length > 0,
      };
    });

    toast.success("Draft deleted");
  }, [saveDraftsToStorage]);

  // Get all drafts
  const getAllDrafts = React.useCallback(() => {
    return Object.values(draftState.drafts);
  }, [draftState.drafts]);

  // Clear all drafts
  const clearAllDrafts = React.useCallback(() => {
    setDraftState(prev => {
      saveDraftsToStorage({});
      return {
        ...prev,
        drafts: {},
        hasUnsavedChanges: false,
        lastSaved: null,
      };
    });

    toast.success("All drafts cleared");
  }, [saveDraftsToStorage]);

  return {
    // CRUD operations
    createTemplate,
    updateTemplate,
    cloneTemplate,
    archiveTemplate,
    restoreTemplate,

    // Draft operations
    saveDraft,
    loadDraft,
    deleteDraft,
    getAllDrafts,
    clearAllDrafts,

    // State
    crudState,
    draftState,

    // Utilities
    hasDraft: (templateId: string) => templateId in draftState.drafts,
    getDraft: (templateId: string) => draftState.drafts[templateId] || null,
  };
}
