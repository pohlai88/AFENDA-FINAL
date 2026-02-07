"use client";

/**
 * Edit Delegated Admin Dialog
 * Edit roles for a delegated admin.
 */

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { IconEdit } from "@tabler/icons-react";
import {
  Button,
  ClientDialog,
  ClientDialogContent,
  ClientDialogDescription,
  ClientDialogFooter,
  ClientDialogHeader,
  ClientDialogTitle,
  ClientDialogTrigger,
  Label,
} from "@afenda/shadcn";
import { updateDelegatedAdminRolesAction } from "../_actions/admin-assignment.actions";
import { RoleMultiSelect } from "./RoleMultiSelect.client";
import type { AdminRole } from "@afenda/orchestra";

interface EditDelegatedAdminDialogProps {
  userId: string;
  displayName?: string;
  currentRoles: AdminRole[];
}

export function EditDelegatedAdminDialog({
  userId,
  displayName,
  currentRoles,
}: EditDelegatedAdminDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [roles, setRoles] = React.useState<AdminRole[]>(currentRoles);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setRoles(currentRoles);
  }, [currentRoles, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roles.length === 0) {
      setError("At least one role is required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateDelegatedAdminRolesAction(userId, roles);
      if (result.success) {
        toast.success("Roles updated");
        setOpen(false);
      } else {
        setError(result.error ?? "Failed to update roles.");
        toast.error(result.error ?? "Failed to update roles.");
      }
    });
  };

  return (
    <ClientDialog open={open} onOpenChange={setOpen}>
      <ClientDialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Edit roles for ${displayName ?? userId}`}>
          <IconEdit className="size-4" />
        </Button>
      </ClientDialogTrigger>
      <ClientDialogContent className="sm:max-w-md">
        <ClientDialogHeader>
          <ClientDialogTitle>Edit Roles</ClientDialogTitle>
          <ClientDialogDescription>
            {displayName ?? userId}
          </ClientDialogDescription>
        </ClientDialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Roles</Label>
            <RoleMultiSelect
              selectedRoles={roles}
              onSelectionChange={setRoles}
              placeholder="Select roles"
              error={error ?? undefined}
              disabled={isPending}
            />
          </div>
          <ClientDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || roles.length === 0}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </ClientDialogFooter>
        </form>
      </ClientDialogContent>
    </ClientDialog>
  );
}
