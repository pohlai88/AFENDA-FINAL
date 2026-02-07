"use client";

/**
 * Enhanced Template Editor Dialog with Searchable Examples
 * Create new or edit existing configuration templates with enterprise search
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  IconPlus,
  IconTrash,
  IconAlertCircle,
  IconSparkles,
  IconServer,
  IconBuilding,
  IconApi,
  IconShieldCheck,
  IconCopy,
} from "@tabler/icons-react";
import { toast } from "sonner";

import {
  ClientDialog,
  ClientDialogContent,
  ClientDialogDescription,
  ClientDialogFooter,
  ClientDialogHeader,
  ClientDialogTitle,
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
  ClientSelect,
  ClientSelectContent,
  ClientSelectItem,
  ClientSelectTrigger,
  ClientSelectValue,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Switch,
  Alert,
  AlertDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@afenda/shadcn";

import { SearchableTemplateExamples } from "./SearchableTemplateExamples";
import type { ConfigTemplate } from "@afenda/orchestra/zod";

const CATEGORY_ICONS = {
  System: IconServer,
  Tenant: IconBuilding,
  Service: IconApi,
  Compliance: IconShieldCheck,
};

/**
 * Template editor form schema
 */
const templateEditorSchema = z.object({
  id: z.string().min(1, "ID is required").regex(/^[a-z0-9-]+$/, "ID must be lowercase letters, numbers, and hyphens"),
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.enum(["System", "Tenant", "Service", "Compliance"]),
  icon: z.string(),
  configs: z.array(
    z.object({
      key: z.string().min(1, "Key is required"),
      value: z.string().min(1, "Default value is required"),
      description: z.string().min(1, "Description is required"),
      required: z.boolean(),
      validationType: z.enum(["string", "number", "boolean", "email", "url", "array", "enum"]),
    })
  ).min(1, "At least one configuration field is required"),
});

type TemplateEditorFormData = z.infer<typeof templateEditorSchema>;

export interface TemplateEditorDialogEnhancedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: ConfigTemplate;
  mode: "create" | "edit" | "clone";
}

export function TemplateEditorDialogEnhanced({
  open,
  onOpenChange,
  template,
  mode,
}: TemplateEditorDialogEnhancedProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("editor");

  // Initialize form with template data or defaults
  const form = useForm<TemplateEditorFormData>({
    resolver: zodResolver(templateEditorSchema),
    defaultValues: template
      ? {
        id: mode === "clone" ? `${template.id}-copy` : template.id,
        name: mode === "clone" ? `${template.name} (Copy)` : template.name,
        description: template.description,
        category: template.category,
        icon: template.icon,
        configs: template.configs.map((c) => ({
          key: c.key,
          value: JSON.stringify(c.value),
          description: c.description,
          required: c.required,
          validationType: c.validation.type as "string" | "number" | "boolean" | "email" | "url" | "array" | "enum",
        })),
      }
      : {
        id: "",
        name: "",
        description: "",
        category: "System",
        icon: "IconSettings",
        configs: [
          {
            key: "",
            value: "",
            description: "",
            required: false,
            validationType: "string",
          },
        ],
      },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "configs",
  });

  const onSubmit = async (_data: TemplateEditorFormData) => {
    setIsSubmitting(true);
    try {
      // TODO: Implement actual API call to save template

      toast.success(
        mode === "create"
          ? "Template created successfully"
          : mode === "edit"
            ? "Template updated successfully"
            : "Template cloned successfully"
      );

      onOpenChange(false);
      router.refresh();
    } catch (_error) {
      toast.error("Failed to save template");
    } finally {
      setIsSubmitting(false);
    }
  };

  const dialogTitle =
    mode === "create"
      ? "Create New Template"
      : mode === "edit"
        ? "Edit Template"
        : "Clone Template";

  const dialogDescription =
    mode === "create"
      ? "Create a reusable configuration template for your system."
      : mode === "edit"
        ? "Modify the template configuration. This will affect future applications."
        : "Create a copy of this template with your own customizations.";

  const handleExampleSelect = React.useCallback((exampleTemplate: ConfigTemplate) => {
    // Populate form with example data
    form.reset({
      id: `${exampleTemplate.id}-custom`,
      name: `${exampleTemplate.name} (Custom)`,
      description: exampleTemplate.description,
      category: exampleTemplate.category,
      icon: exampleTemplate.icon,
      configs: exampleTemplate.configs.map((c) => ({
        key: c.key,
        value: JSON.stringify(c.value),
        description: c.description,
        required: c.required,
        validationType: c.validation.type as "string" | "number" | "boolean" | "email" | "url" | "array" | "enum",
      })),
    });

    // Switch to editor tab
    setActiveTab("editor");

    toast.success("Template example loaded", {
      description: `Based on &ldquo;${exampleTemplate.name}&rdquo;`,
    });
  }, [form]);

  const handleExamplePreview = React.useCallback((_exampleTemplate: ConfigTemplate) => {
    // Could open a preview dialog or navigate to preview
  }, []);

  return (
    <ClientDialog open={open} onOpenChange={onOpenChange}>
      <ClientDialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <ClientDialogHeader>
          <ClientDialogTitle className="flex items-center gap-2">
            <IconSparkles className="size-5" />
            {dialogTitle}
          </ClientDialogTitle>
          <ClientDialogDescription>{dialogDescription}</ClientDialogDescription>
        </ClientDialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor" className="flex items-center gap-2">
              Template Editor
            </TabsTrigger>
            <TabsTrigger value="examples" className="flex items-center gap-2">
              Browse Examples
              <IconCopy className="size-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Template Metadata */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Template Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Template ID */}
                      <FormField
                        control={form.control}
                        name="id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Template ID</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="my-custom-template"
                                className="font-mono"
                                disabled={mode === "edit"}
                              />
                            </FormControl>
                            <FormDescription>
                              Lowercase letters, numbers, and hyphens only
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Category */}
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <ClientSelect value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <ClientSelectTrigger>
                                  <ClientSelectValue placeholder="Select category" />
                                </ClientSelectTrigger>
                              </FormControl>
                              <ClientSelectContent>
                                {(["System", "Tenant", "Service", "Compliance"] as const).map((cat) => {
                                  const Icon = CATEGORY_ICONS[cat];
                                  return (
                                    <ClientSelectItem key={cat} value={cat}>
                                      <div className="flex items-center gap-2">
                                        <Icon className="size-4" />
                                        {cat}
                                      </div>
                                    </ClientSelectItem>
                                  );
                                })}
                              </ClientSelectContent>
                            </ClientSelect>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Template Name */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="My Custom Configuration" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Describe what this template configures and when to use it..."
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Configuration Fields */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Configuration Fields</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Define the settings this template will configure
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          append({
                            key: "",
                            value: "",
                            description: "",
                            required: false,
                            validationType: "string",
                          })
                        }
                      >
                        <IconPlus className="mr-2 size-4" />
                        Add Field
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {fields.map((field, index) => (
                      <Card key={field.id} className="border-dashed">
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">Field {index + 1}</Badge>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                disabled={fields.length === 1}
                              >
                                <IconTrash className="size-4" />
                              </Button>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                              {/* Config Key */}
                              <FormField
                                control={form.control}
                                name={`configs.${index}.key`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Key</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder="setting.name"
                                        className="font-mono text-sm"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {/* Default Value */}
                              <FormField
                                control={form.control}
                                name={`configs.${index}.value`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Default Value</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder="default value"
                                        className="font-mono text-sm"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {/* Validation Type */}
                              <FormField
                                control={form.control}
                                name={`configs.${index}.validationType`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <ClientSelect value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                        <ClientSelectTrigger>
                                          <ClientSelectValue />
                                        </ClientSelectTrigger>
                                        </FormControl>
                                      <ClientSelectContent>
                                        <ClientSelectItem value="string">String</ClientSelectItem>
                                        <ClientSelectItem value="number">Number</ClientSelectItem>
                                        <ClientSelectItem value="boolean">Boolean</ClientSelectItem>
                                        <ClientSelectItem value="email">Email</ClientSelectItem>
                                        <ClientSelectItem value="url">URL</ClientSelectItem>
                                        <ClientSelectItem value="array">Array</ClientSelectItem>
                                      </ClientSelectContent>
                                    </ClientSelect>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            {/* Description */}
                            <FormField
                              control={form.control}
                              name={`configs.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="What this setting controls..."
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Required Toggle */}
                            <FormField
                              control={form.control}
                              name={`configs.${index}.required`}
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel>Required Field</FormLabel>
                                    <FormDescription className="text-xs">
                                      Users must provide this value
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>

                {/* System Templates Warning */}
                {mode === "edit" && !template?.id.startsWith("custom-") && (
                  <Alert variant="destructive">
                    <IconAlertCircle className="size-4" />
                    <AlertDescription>
                      System templates are immutable. Use &ldquo;Save as New&rdquo; to create a customized version.
                    </AlertDescription>
                  </Alert>
                )}

                <ClientDialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : mode === "create" ? "Create Template" : "Save Changes"}
                  </Button>
                </ClientDialogFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="examples" className="mt-4">
            <SearchableTemplateExamples
              onExampleSelect={handleExampleSelect}
              onExamplePreview={handleExamplePreview}
              maxVisible={12}
              showCategories={true}
            />
          </TabsContent>
        </Tabs>
      </ClientDialogContent>
    </ClientDialog>
  );
}
