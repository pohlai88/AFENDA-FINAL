"use client";

/**
 * Enhanced Template CRUD Actions
 * Complete CRUD operations with dangerous zone confirmations
 */

import * as React from "react";
import {
  IconEdit,
  IconCopy,
  IconArchive,
  IconRestore,
  IconTrash,
  IconDotsVertical,
  IconEye,
  IconDeviceFloppy,
  IconAlertTriangle,
} from "@tabler/icons-react";

import {
  ClientDropdownMenu,
  ClientDropdownMenuContent,
  ClientDropdownMenuItem,
  ClientDropdownMenuSeparator,
  ClientDropdownMenuTrigger,
  Button,
  Badge,
} from "@afenda/shadcn";

import { useTemplateCRUD } from "../_hooks/useTemplateCRUD";
import { DangerZoneConfirm } from "../../_components/DangerZoneConfirm";
import type { ConfigTemplate } from "@afenda/orchestra/zod";

export interface EnhancedCRUDActionsProps {
  template: ConfigTemplate;
  onView: () => void;
  onEdit: () => void;
  onSaveAsNew: () => void;
  onRefresh?: () => void;
  isCustomTemplate?: boolean;
  isArchived?: boolean;
}

export function EnhancedCRUDActions({
  template,
  onView,
  onEdit,
  onSaveAsNew,
  onRefresh,
  isCustomTemplate = false,
  isArchived = false,
}: EnhancedCRUDActionsProps) {
  const [showArchiveConfirm, setShowArchiveConfirm] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = React.useState(false);

  const {
    archiveTemplate,
    restoreTemplate,
    hasDraft,
    deleteDraft,
  } = useTemplateCRUD();

  const hasDraftForTemplate = hasDraft(template.id);

  const handleArchive = React.useCallback(async () => {
    try {
      await archiveTemplate(template.id);
      setShowArchiveConfirm(false);
      onRefresh?.();
    } catch (_error) {
      // Error handled by hook
    }
  }, [template.id, archiveTemplate, onRefresh]);

  const handleRestore = React.useCallback(async () => {
    try {
      await restoreTemplate(template.id);
      setShowRestoreConfirm(false);
      onRefresh?.();
    } catch (_error) {
      // Error handled by hook
    }
  }, [template.id, restoreTemplate, onRefresh]);

  const handleDelete = React.useCallback(async () => {
    try {
      // For immutable system templates, we archive instead of delete
      if (!isCustomTemplate) {
        await archiveTemplate(template.id);
      } else {
        // For custom templates, we could implement actual delete
        await archiveTemplate(template.id); // Using archive as safe default
      }
      setShowDeleteConfirm(false);
      onRefresh?.();
    } catch (_error) {
      // Error handled by hook
    }
  }, [template.id, isCustomTemplate, archiveTemplate, onRefresh]);

  const handleDeleteDraft = React.useCallback(() => {
    deleteDraft(template.id);
    onRefresh?.();
  }, [template.id, deleteDraft, onRefresh]);

  if (isArchived) {
    // Show restore actions for archived templates
    return (
      <>
        <ClientDropdownMenu>
          <ClientDropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <IconDotsVertical className="size-4" />
              <span className="sr-only">Template actions</span>
            </Button>
          </ClientDropdownMenuTrigger>
          <ClientDropdownMenuContent align="end" className="w-48">
            {/* View/Preview */}
            <ClientDropdownMenuItem onClick={onView}>
              <IconEye className="mr-2 size-4" />
              View Details
            </ClientDropdownMenuItem>

            <ClientDropdownMenuSeparator />

            {/* Restore */}
            <ClientDropdownMenuItem
              onClick={() => setShowRestoreConfirm(true)}
              className="text-green-600 focus:text-green-600 dark:text-green-400"
            >
              <IconRestore className="mr-2 size-4" />
              Restore Template
            </ClientDropdownMenuItem>

            {/* Clone */}
            <ClientDropdownMenuItem onClick={onSaveAsNew}>
              <IconCopy className="mr-2 size-4" />
              Clone Template
            </ClientDropdownMenuItem>
          </ClientDropdownMenuContent>
        </ClientDropdownMenu>

        {/* Restore Confirmation */}
        <DangerZoneConfirm
          open={showRestoreConfirm}
          onOpenChange={setShowRestoreConfirm}
          onConfirm={handleRestore}
          title="Restore Template"
          description={`This will restore "${template.name}" back to the active template list.`}
          confirmWord="RESTORE"
          confirmLabel="Type RESTORE to confirm"
          actionLabel="Restore Template"
          variant={undefined}
        />
      </>
    );
  }

  return (
    <>
      <ClientDropdownMenu>
        <ClientDropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <IconDotsVertical className="size-4" />
            <span className="sr-only">Template actions</span>
          </Button>
        </ClientDropdownMenuTrigger>
        <ClientDropdownMenuContent align="end" className="w-56">
          {/* Template Status */}
          <div className="px-2 py-1.5">
            <div className="flex items-center gap-2">
              <Badge variant={isCustomTemplate ? "secondary" : "default"} className="text-xs">
                {isCustomTemplate ? "Custom" : "System"}
              </Badge>
              {hasDraftForTemplate && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <IconDeviceFloppy className="size-3" />
                  Draft
                </Badge>
              )}
            </div>
          </div>

          <ClientDropdownMenuSeparator />

          {/* View/Preview */}
          <ClientDropdownMenuItem onClick={onView}>
            <IconEye className="mr-2 size-4" />
            View Details
          </ClientDropdownMenuItem>

          <ClientDropdownMenuSeparator />

          {/* Edit - Only for custom templates */}
          {isCustomTemplate && (
            <ClientDropdownMenuItem onClick={onEdit}>
              <IconEdit className="mr-2 size-4" />
              Edit Template
            </ClientDropdownMenuItem>
          )}

          {/* Save as New */}
          <ClientDropdownMenuItem onClick={onSaveAsNew}>
            <IconCopy className="mr-2 size-4" />
            Save as New
          </ClientDropdownMenuItem>

          {/* Archive - Only for custom templates, system templates are immutable */}
          {isCustomTemplate && (
            <>
              <ClientDropdownMenuSeparator />
              <ClientDropdownMenuItem
                onClick={() => setShowArchiveConfirm(true)}
                className="text-amber-600 focus:text-amber-600 dark:text-amber-400"
              >
                <IconArchive className="mr-2 size-4" />
                Archive
              </ClientDropdownMenuItem>
            </>
          )}

          {/* Delete/Archive - For system templates (immutable) */}
          {!isCustomTemplate && (
            <>
              <ClientDropdownMenuSeparator />
              <ClientDropdownMenuItem
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 focus:text-red-600 dark:text-red-400"
              >
                <IconAlertTriangle className="mr-2 size-4" />
                Archive System Template
              </ClientDropdownMenuItem>
            </>
          )}

          {/* Delete Draft */}
          {hasDraftForTemplate && (
            <>
              <ClientDropdownMenuSeparator />
              <ClientDropdownMenuItem
                onClick={handleDeleteDraft}
                className="text-red-600 focus:text-red-600 dark:text-red-400"
              >
                <IconTrash className="mr-2 size-4" />
                Delete Draft
              </ClientDropdownMenuItem>
            </>
          )}
        </ClientDropdownMenuContent>
      </ClientDropdownMenu>

      {/* Archive Confirmation */}
      <DangerZoneConfirm
        open={showArchiveConfirm}
        onOpenChange={setShowArchiveConfirm}
        onConfirm={handleArchive}
        title="Archive Template"
        description={`This will archive "${template.name}". The template will no longer appear in the active list but can be restored later.`}
        confirmWord="ARCHIVE"
        confirmLabel="Type ARCHIVE to confirm"
        actionLabel="Archive Template"
        variant="warning"
      />

      {/* Delete/Archive Confirmation for System Templates */}
      <DangerZoneConfirm
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title={isCustomTemplate ? "Delete Template" : "Archive System Template"}
        description={
          isCustomTemplate
            ? `This will permanently delete "${template.name}". This action cannot be undone.`
            : `System templates are immutable. This will archive "${template.name}" instead of deleting it. The template can be restored later.`
        }
        confirmWord={isCustomTemplate ? "DELETE" : "ARCHIVE"}
        confirmLabel={`Type ${isCustomTemplate ? "DELETE" : "ARCHIVE"} to confirm`}
        actionLabel={isCustomTemplate ? "Delete Template" : "Archive Template"}
        variant="destructive"
      />
    </>
  );
}
