/**
 * @domain tenancy
 * @layer components
 * @responsibility Reusable organization create/update form
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
} from "@afenda/shadcn";
import { tenancyCreateOrganizationSchema } from "../../zod";

export const organizationFormSchema = tenancyCreateOrganizationSchema.extend({
  slug: z.string().optional(),
});

export type OrganizationFormValues = z.infer<typeof organizationFormSchema>;

export interface OrganizationFormProps {
  defaultValues?: Partial<OrganizationFormValues>;
  onSubmit: (values: OrganizationFormValues) => void | Promise<void>;
  submitLabel?: string;
  isLoading?: boolean;
}

export function OrganizationForm({
  defaultValues,
  onSubmit,
  submitLabel = "Create Organization",
  isLoading = false,
}: OrganizationFormProps) {
  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      slug: defaultValues?.slug ?? "",
      description: defaultValues?.description ?? "",
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Acme Inc" 
                  {...field} 
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                The display name for your organization.
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
                  placeholder="acme-inc" 
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
                  placeholder="A brief description of your organization..." 
                  className="min-h-[100px]"
                  {...field} 
                  value={field.value ?? ""}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                Optional description of your organization.
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
