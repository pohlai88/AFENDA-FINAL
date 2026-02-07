"use client";

/**
 * Template CRUD Actions Component
 * Manages Create, Read, Update, Archive operations for templates
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  IconEdit,
  IconCopy,
  IconArchive,
  IconDotsVertical,
  IconEye,
} from "@tabler/icons-react";
import { toast } from "sonner";

import {
  ClientDropdownMenu,
  ClientDropdownMenuContent,
  ClientDropdownMenuItem,
  ClientDropdownMenuSeparator,
  ClientDropdownMenuTrigger,
  Button,
} from "@afenda/shadcn";

import { DangerZoneConfirm } from "./DangerZoneConfirm";
import { routes } from "@afenda/shared/constants";
import type { ConfigTemplate } from "@afenda/orchestra/zod";

export interface TemplateCRUDActionsProps {
  template: ConfigTemplate;
  onView: () => void;
  onEdit: () => void;
  onSaveAsNew: () => void;
  onArchive?: () => void;
  isCustomTemplate?: boolean;
}

export function TemplateCRUDActions({
  template,
  onView,
  onEdit,
  onSaveAsNew,
  onArchive,
  isCustomTemplate = false,
}: TemplateCRUDActionsProps) {
  const router = useRouter();
  const [showArchiveConfirm, setShowArchiveConfirm] = React.useState(false);

  const handleArchive = async () => {
    try {
      const response = await fetch(routes.api.orchestra.configTemplatesOps("archive"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: template.id, action: "archive" }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message ?? "Failed to archive template");
      }
      toast.success(`Template "${template.name}" archived`, {
        description: "The template has been moved to archive and can be restored later",
      });
      setShowArchiveConfirm(false);
      if (onArchive) {
        onArchive();
      }
      router.refresh();
    } catch (error) {
      toast.error("Failed to archive template", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    }
  };

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
        </ClientDropdownMenuContent>
      </ClientDropdownMenu>

      {/* Archive Confirmation Dialog */}
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
    </>
  );
}
