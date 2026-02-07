"use client";

/**
 * Delegated Admins Table
 * Table: ID, Name, Contact, Email, Roles, Actions.
 * Add row with dropdown role selector (shadcn Popover + Command).
 */

import * as React from "react";
import { useActionState } from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Button,
  Input,
} from "@afenda/shadcn";
import { removeDelegatedAdminAction, addDelegatedAdminAction, type ActionState } from "../_actions/admin-assignment.actions";
import { EditDelegatedAdminDialog } from "./EditDelegatedAdminDialog.client";
import { RoleMultiSelect } from "./RoleMultiSelect.client";
import { ADMIN_ROLE_LABELS } from "../_constants/admin-assignment.constants";
import type { AdminRole } from "@afenda/orchestra";
import type { DelegatedAdmin } from "@afenda/orchestra";

export interface DelegatedAdminsTableProps {
  delegatedAdmins: DelegatedAdmin[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const initialState: ActionState = {};

export function DelegatedAdminsTable({ delegatedAdmins }: DelegatedAdminsTableProps) {
  const [isPendingRemove, startRemoveTransition] = useTransition();
  const [state, formAction, isPendingAdd] = useActionState(addDelegatedAdminAction, initialState);
  const [selectedRoles, setSelectedRoles] = React.useState<AdminRole[]>([]);

  React.useEffect(() => {
    if (state?.success) setSelectedRoles([]);
  }, [state?.success]);

  const handleRemove = (userId: string) => {
    if (!confirm(`Remove ${userId} from delegated admins?`)) return;
    startRemoveTransition(async () => {
      const result = await removeDelegatedAdminAction(userId);
      if (result?.success) toast.success("Delegated admin removed");
      else if (result?.error) toast.error(result.error);
    });
  };

  React.useEffect(() => {
    if (state?.success) toast.success("Delegated admin added");
    else if (state?.error && !state?.errors) toast.error(state.error);
  }, [state?.success, state?.error, state?.errors]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delegated Administrators</CardTitle>
        <CardDescription>
          Users with scoped admin roles. Use the dropdown to select roles.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Add-by-matrix prefix row */}
            <TableRow className="bg-muted/50">
              <TableCell colSpan={7} className="p-3">
                <form
                  key={state?.success ? "add-success" : "add-form"}
                  action={formAction}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto_auto] items-end"
                  aria-label="Add delegated administrator"
                >
                  <div className="space-y-1">
                    <Input
                      name="userId"
                      placeholder="User ID / email"
                      required
                      className="h-8 text-sm"
                    />
                    {state?.errors?.userId && (
                      <p className="text-xs text-destructive">{state.errors.userId[0]}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Input
                      name="displayName"
                      placeholder="Name"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Input
                      name="contact"
                      placeholder="Contact"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Input
                      name="email"
                      type="email"
                      placeholder="Email"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="min-w-[180px]">
                    <RoleMultiSelect
                      selectedRoles={selectedRoles}
                      onSelectionChange={setSelectedRoles}
                      placeholder="Select roles"
                      error={state?.errors?.roles?.[0]}
                      disabled={isPendingAdd}
                      name="roles"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isPendingAdd || selectedRoles.length === 0}
                    title={selectedRoles.length === 0 ? "Select at least one role" : undefined}
                  >
                    <IconPlus className="mr-1 size-3" />
                    {isPendingAdd ? "Adding…" : "Add"}
                  </Button>
                </form>
              </TableCell>
            </TableRow>

            {delegatedAdmins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                  No delegated admins. Use the row above to add one.
                </TableCell>
              </TableRow>
            ) : (
              delegatedAdmins.map((d) => (
                <TableRow key={d.userId}>
                  <TableCell className="font-mono text-sm">{d.userId}</TableCell>
                  <TableCell className="font-medium">
                    {d.displayName ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {d.contact ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {d.email ?? d.userId}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {d.roles.map((role) => (
                        <Badge key={role} variant="secondary" className="text-xs">
                          {ADMIN_ROLE_LABELS[role]}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(d.addedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <EditDelegatedAdminDialog
                        userId={d.userId}
                        displayName={d.displayName}
                        currentRoles={d.roles}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(d.userId)}
                        disabled={isPendingRemove}
                        aria-label={`Remove ${d.userId}`}
                      >
                        <IconTrash className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {state?.error && !state?.errors && (
          <p className="text-sm text-destructive mt-2" role="alert" aria-live="polite">
            {state.error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
