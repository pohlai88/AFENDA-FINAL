/**
 * @domain tenancy
 * @layer components
 * @responsibility Create invitation form
 */

"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
  Button,
  ClientSelect,
  ClientSelectContent,
  ClientSelectItem,
  ClientSelectTrigger,
  ClientSelectValue,
} from "@afenda/shadcn";
import { tenancyCreateOrgInvitationSchema } from "../../zod";

export type InvitationFormValues = z.infer<typeof tenancyCreateOrgInvitationSchema>;

export interface InvitationFormProps {
  defaultValues?: Partial<InvitationFormValues>;
  onSubmit: (values: InvitationFormValues) => void | Promise<void>;
  submitLabel?: string;
  isLoading?: boolean;
  hideRoleSelect?: boolean;
  defaultRole?: "owner" | "admin" | "member";
}

export function InvitationForm({
  defaultValues,
  onSubmit,
  submitLabel = "Send Invitation",
  isLoading = false,
  hideRoleSelect = false,
  defaultRole = "member",
}: InvitationFormProps) {
  const form = useForm<InvitationFormValues>({
    resolver: zodResolver(tenancyCreateOrgInvitationSchema),
    defaultValues: {
      email: defaultValues?.email ?? "",
      role: defaultValues?.role ?? defaultRole,
      message: defaultValues?.message ?? "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input 
                  type="email"
                  placeholder="colleague@example.com" 
                  {...field} 
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                The email address of the person you want to invite.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {!hideRoleSelect && (
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <ClientSelect
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <ClientSelectTrigger>
                      <ClientSelectValue placeholder="Select a role" />
                    </ClientSelectTrigger>
                  </FormControl>
                  <ClientSelectContent>
                    <ClientSelectItem value="member">Member</ClientSelectItem>
                    <ClientSelectItem value="admin">Admin</ClientSelectItem>
                    <ClientSelectItem value="owner">Owner</ClientSelectItem>
                  </ClientSelectContent>
                </ClientSelect>
                <FormDescription>
                  The role this person will have in the organization.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add a personal message to your invitation..." 
                  className="min-h-[100px]"
                  {...field} 
                  value={field.value ?? ""}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                Optional message to include with the invitation.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Sending..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
