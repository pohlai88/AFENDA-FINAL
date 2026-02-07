"use client";

/**
 * Transfer Primary Administrator Dialog
 * Dialog form to transfer primary admin to another user.
 */

import * as React from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { IconArrowRight } from "@tabler/icons-react";
import {
  Button,
  ClientDialog,
  ClientDialogContent,
  ClientDialogDescription,
  ClientDialogFooter,
  ClientDialogHeader,
  ClientDialogTitle,
  ClientDialogTrigger,
  Input,
  Label,
} from "@afenda/shadcn";
import { setPrimaryAdminAction, type ActionState } from "../_actions/admin-assignment.actions";
import { SubmitButton } from "./SubmitButton";
import type { PrimaryAdminEntry } from "@afenda/orchestra";

interface TransferPrimaryDialogProps {
  currentPrimary: PrimaryAdminEntry;
}

const initialState: ActionState = {};

export function TransferPrimaryDialog({ currentPrimary }: TransferPrimaryDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction] = useActionState(setPrimaryAdminAction, initialState);

  React.useEffect(() => {
    if (state?.success) {
      toast.success("Primary admin transferred");
      setOpen(false);
    } else if (state?.error && !state?.errors) {
      toast.error(state.error);
    }
  }, [state?.success, state?.error, state?.errors]);

  return (
    <ClientDialog open={open} onOpenChange={setOpen}>
      <ClientDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <IconArrowRight className="mr-1 size-3" />
          Transfer
        </Button>
      </ClientDialogTrigger>
      <ClientDialogContent className="sm:max-w-md">
        <ClientDialogHeader>
          <ClientDialogTitle>Transfer Primary Administrator</ClientDialogTitle>
          <ClientDialogDescription>
            Assign a new primary admin. Current: {currentPrimary.displayName ?? currentPrimary.userId}
          </ClientDialogDescription>
        </ClientDialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transfer-userId">User ID or Email</Label>
            <Input
              id="transfer-userId"
              name="userId"
              placeholder="user@example.com"
              required
            />
            {state?.errors?.userId && (
              <p className="text-xs text-destructive">{state.errors.userId[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="transfer-displayName">Name</Label>
            <Input id="transfer-displayName" name="displayName" placeholder="Display name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transfer-email">Email</Label>
            <Input id="transfer-email" name="email" type="email" placeholder="email@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transfer-contact">Contact</Label>
            <Input id="transfer-contact" name="contact" placeholder="Phone or contact" />
          </div>
          {state?.error && !state?.errors && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <ClientDialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton>Transfer</SubmitButton>
          </ClientDialogFooter>
        </form>
      </ClientDialogContent>
    </ClientDialog>
  );
}
