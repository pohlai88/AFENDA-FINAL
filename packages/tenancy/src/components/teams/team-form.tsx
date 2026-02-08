/**
 * @domain tenancy
 * @layer components
 * @responsibility Reusable team create/update form
 */

"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
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
import { tenancyCreateTeamSchema } from "../../zod";
import { useOrganizationsQuery } from "../../query";

export const teamFormSchema = tenancyCreateTeamSchema.extend({
  slug: z.string().optional(),
  parentId: z.string().nullable().optional(),
});

export type TeamFormValues = z.infer<typeof teamFormSchema>;

export interface TeamFormProps {
  defaultValues?: Partial<TeamFormValues>;
  onSubmit: (values: TeamFormValues) => void | Promise<void>;
  submitLabel?: string;
  isLoading?: boolean;
  organizationId?: string;
}

export function TeamForm({
  defaultValues,
  onSubmit,
  submitLabel = "Create Team",
  isLoading = false,
  organizationId,
}: TeamFormProps) {
  const { data: orgsData } = useOrganizationsQuery(undefined, {
    enabled: !organizationId,
  });

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      slug: defaultValues?.slug ?? "",
      description: defaultValues?.description ?? "",
      organizationId: defaultValues?.organizationId ?? organizationId ?? "",
      parentId: defaultValues?.parentId ?? null,
      ...defaultValues,
    },
  });

  const watchedName = useWatch({ control: form.control, name: "name" });
  const watchedSlug = useWatch({ control: form.control, name: "slug" });

  // Auto-generate slug from name if slug is empty
  React.useEffect(() => {
    if (!watchedSlug && watchedName) {
      const autoSlug = watchedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      form.setValue("slug", autoSlug, { shouldValidate: false });
    }
  }, [watchedName, watchedSlug, form]);

  const organizations = orgsData?.items ?? [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {!organizationId && (
          <FormField
            control={form.control}
            name="organizationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization</FormLabel>
                <ClientSelect
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <ClientSelectTrigger>
                      <ClientSelectValue placeholder="Select an organization" />
                    </ClientSelectTrigger>
                  </FormControl>
                  <ClientSelectContent>
                    {organizations.map((org) => (
                      <ClientSelectItem key={org.id} value={org.id}>
                        {org.name}
                      </ClientSelectItem>
                    ))}
                  </ClientSelectContent>
                </ClientSelect>
                <FormDescription>
                  The organization this team belongs to.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Engineering Team" 
                  {...field} 
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                The display name for your team.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input 
                  placeholder="engineering-team" 
                  {...field} 
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                URL-friendly identifier (auto-generated from name).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="A brief description of your team..." 
                  className="min-h-[100px]"
                  {...field} 
                  value={field.value ?? ""}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                Optional description of your team.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
