"use client";

/**
 * Primary Administrator Table
 * Table layout: ID, Name, Contact, Email, Transfer Primary, RBAC (Full).
 */

import * as React from "react";
import { useActionState } from "react";
import { toast } from "sonner";
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
  Input,
  Label,
} from "@afenda/shadcn";
import { setPrimaryAdminAction, type ActionState } from "../_actions/admin-assignment.actions";
import { SubmitButton } from "./SubmitButton";
import { TransferPrimaryDialog } from "./TransferPrimaryDialog.client";
import type { PrimaryAdminEntry } from "@afenda/orchestra";

interface PrimaryAdminTableProps {
  primaryAdmin: PrimaryAdminEntry | null;
}

const initialState: ActionState = {};

export function PrimaryAdminTable({ primaryAdmin }: PrimaryAdminTableProps) {
  const [state, formAction] = useActionState(setPrimaryAdminAction, initialState);

  React.useEffect(() => {
    if (state?.success) {
      toast.success(primaryAdmin ? "Primary admin transferred" : "Primary admin assigned");
    } else if (state?.error && !state?.errors) {
      toast.error(state.error);
    }
  }, [state?.success, state?.error, state?.errors, primaryAdmin]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Primary Administrator</CardTitle>
        <CardDescription>
          The primary admin has full RBAC and can assign delegated admins.
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
              <TableHead>RBAC</TableHead>
              <TableHead className="w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {primaryAdmin ? (
              <TableRow>
                <TableCell className="font-mono text-sm">{primaryAdmin.userId}</TableCell>
                <TableCell className="font-medium">
                  {primaryAdmin.displayName ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {primaryAdmin.contact ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {primaryAdmin.email ?? primaryAdmin.userId}
                </TableCell>
                <TableCell>
                  <Badge variant="default" className="bg-emerald-600">
                    Full Admin
                  </Badge>
                </TableCell>
                <TableCell>
                  <TransferPrimaryDialog currentPrimary={primaryAdmin} />
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No primary admin assigned. Use the form below to assign one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-medium mb-3">
            {primaryAdmin ? "Transfer Primary Administrator" : "Assign Primary Administrator"}
          </h4>
          <form action={formAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="pa-userId">User ID or Email</Label>
              <Input
                id="pa-userId"
                name="userId"
                placeholder="user@example.com"
                required
              />
              {state?.errors?.userId && (
                <p className="text-xs text-destructive">{state.errors.userId[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pa-displayName">Name</Label>
              <Input
                id="pa-displayName"
                name="displayName"
                placeholder="Display name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pa-email">Email</Label>
              <Input
                id="pa-email"
                name="email"
                type="email"
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pa-contact">Contact</Label>
              <Input
                id="pa-contact"
                name="contact"
                placeholder="Phone or contact"
              />
            </div>
            <div className="flex items-end">
              <SubmitButton>
                {primaryAdmin ? "Transfer" : "Assign"}
              </SubmitButton>
            </div>
          </form>
          {state?.error && !state?.errors && (
            <p className="text-sm text-destructive mt-2" aria-live="polite">
              {state.error}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
