"use client";

/**
 * Enhanced Template Editor with Full CRUD and Draft Support
 * Complete template management with dangerous zone confirmations
 */

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  IconPlus,
  IconTrash,
  IconDeviceFloppy,
  IconLoader2,
  IconAlertCircle,
  IconSparkles,
  IconServer,
  IconBuilding,
  IconApi,
  IconShieldCheck,
  IconCopy,
  IconX,
} from "@tabler/icons-react";

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
  ClientDropdownMenu,
  ClientDropdownMenuContent,
  ClientDropdownMenuItem,
  ClientDropdownMenuTrigger,
} from "@afenda/shadcn";

import { useTemplateCRUD } from "../_hooks/useTemplateCRUD";
import { SearchableTemplateExamples } from "./SearchableTemplateExamples";
import { DangerZoneConfirm } from "../../_components/DangerZoneConfirm";
import type { ConfigTemplate } from "@afenda/orchestra/zod";

const CATEGORY_ICONS = {
  System: IconServer,
  Tenant: IconBuilding,
  Service: IconApi,
  Compliance: IconShieldCheck,
};

/** Form config item - maps to ConfigField for API */
const formConfigSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Default value is required"),
  description: z.string().min(1, "Description is required"),
  required: z.boolean(),
  validationType: z.enum(["string", "number", "boolean", "email", "url", "array", "enum"]),
  enumValues: z.string().optional(), // comma-separated for type "enum"
});

/**
 * Template editor form schema
 */
const templateEditorSchema = z.object({
  id: z.string().min(1, "ID is required").regex(/^[a-z0-9-]+$/, "ID must be lowercase letters, numbers, and hyphens"),
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.enum(["System", "Tenant", "Service", "Compliance"]),
  icon: z.string(),
  configs: z.array(formConfigSchema).min(1, "At least one configuration field is required"),
});

/** Convert form config to ConfigField validation shape */
function toValidation(config: z.infer<typeof formConfigSchema>): ConfigTemplate["configs"][number]["validation"] {
  if (config.validationType === "enum") {
    const enumArr = (config.enumValues ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return { type: "enum", enum: enumArr.length > 0 ? enumArr : [""] };
  }
  return { type: config.validationType } as ConfigTemplate["configs"][number]["validation"];
}

type TemplateEditorFormData = z.infer<typeof templateEditorSchema>;

export interface EnhancedTemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: ConfigTemplate;
  mode: "create" | "edit" | "clone";
  onSuccess?: () => void;
}

export function EnhancedTemplateEditor({
  open,
  onOpenChange,
  template,
  mode,
  onSuccess,
}: EnhancedTemplateEditorProps) {
  const [activeTab, setActiveTab] = React.useState("editor");
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [showSaveAsNewDialog, setShowSaveAsNewDialog] = React.useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const {
    createTemplate,
    updateTemplate,
    cloneTemplate,
    archiveTemplate,
    saveDraft,
    loadDraft,
    hasDraft,
    deleteDraft,
  } = useTemplateCRUD();

  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
          enumValues: c.validation.type === "enum" ? (c.validation.enum ?? []).join(", ") : undefined,
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
            enumValues: undefined,
          },
        ],
      },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "configs",
  });

  const templateId = form.watch("id");
  const templateName = form.watch("name");

  // Load draft on mount if exists
  React.useEffect(() => {
    if (open && templateId && hasDraft(templateId)) {
      const draft = loadDraft(templateId);
      if (draft) {
        // Populate form with draft data
        if (draft.template.name) form.setValue("name", draft.template.name);
        if (draft.template.description) form.setValue("description", draft.template.description);
        if (draft.template.category) form.setValue("category", draft.template.category);
        if (draft.template.configs) {
          form.setValue("configs", draft.template.configs.map(c => ({
            key: c.key,
            value: JSON.stringify(c.value),
            description: c.description,
            required: c.required,
            validationType: c.validation.type as "string" | "number" | "boolean" | "email" | "url" | "array" | "enum",
            enumValues: c.validation.type === "enum" ? (c.validation.enum ?? []).join(", ") : undefined,
          })));
        }
        // Apply draft values (only for known form fields)
        Object.entries(draft.values).forEach(([key, value]) => {
          if (key.startsWith('configs.')) {
            form.setValue(key as keyof TemplateEditorFormData, value as string);
          } else if (['name', 'description', 'category', 'icon'].includes(key)) {
            form.setValue(key as keyof TemplateEditorFormData, value as string);
          }
        });
      }
    }
  }, [open, templateId, hasDraft, loadDraft, form]);

  // Track form changes
  React.useEffect(() => {
    const subscription = form.watch(() => {
      setHasUnsavedChanges(true);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Save draft
  const handleSaveDraft = React.useCallback(async () => {
    if (!templateId || !templateName) return;

    const currentValues = form.getValues();
    const templateData = {
      name: currentValues.name,
      description: currentValues.description,
      category: currentValues.category,
      icon: currentValues.icon,
      configs: currentValues.configs.map(c => ({
        key: c.key,
        value: JSON.parse(c.value) as unknown,
        description: c.description,
        required: c.required,
        validation: toValidation(c),
      })),
    };

    saveDraft(templateId, templateData, currentValues, mode);
    setHasUnsavedChanges(false);
  }, [templateId, templateName, form, mode, saveDraft]);

  // Submit form
  const onSubmit = async (data: TemplateEditorFormData) => {
    setIsSubmitting(true);
    try {
      const templateData = {
        ...data,
        configs: data.configs.map(c => ({
          key: c.key,
          value: JSON.parse(c.value) as unknown,
          description: c.description,
          required: c.required,
          validation: toValidation(c),
        })),
      };

      if (mode === "create") {
        await createTemplate(templateData);
      } else if (mode === "edit" && template) {
        await updateTemplate(template.id, templateData);
      } else if (mode === "clone" && template) {
        await cloneTemplate(template.id, templateData);
      }

      setHasUnsavedChanges(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (_error) {
      // Error handled by hook
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save as new template
  const handleSaveAsNew = React.useCallback(async () => {
    const currentValues = form.getValues();
    const newTemplateData = {
      ...currentValues,
      id: `${currentValues.id}-copy-${Date.now()}`,
      name: `${currentValues.name} (Copy)`,
      configs: currentValues.configs.map(c => ({
        key: c.key,
        value: JSON.parse(c.value) as unknown,
        description: c.description,
        required: c.required,
        validation: toValidation(c),
      })),
    };

    try {
      await createTemplate(newTemplateData);
      setShowSaveAsNewDialog(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (_error) {
      // Error handled by hook
    }
  }, [form, createTemplate, onOpenChange, onSuccess]);

  // Archive template
  const handleArchive = React.useCallback(async () => {
    if (!template) return;

    try {
      await archiveTemplate(template.id);
      setShowArchiveDialog(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (_error) {
      // Error handled by hook
    }
  }, [template, archiveTemplate, onOpenChange, onSuccess]);

  // Delete draft
  const handleDeleteDraft = React.useCallback(() => {
    if (!templateId) return;

    deleteDraft(templateId);
    setHasUnsavedChanges(false);
    setShowDeleteDialog(false);
  }, [templateId, deleteDraft]);

  // Handle example selection
  const handleExampleSelect = React.useCallback((exampleTemplate: ConfigTemplate) => {
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
        enumValues: c.validation.type === "enum" ? (c.validation.enum ?? []).join(", ") : undefined,
      })),
    });

    setActiveTab("editor");
    setHasUnsavedChanges(true);
  }, [form]);

  const dialogTitle =
    mode === "create"
      ? "Create New Template"
      : mode === "edit"
        ? "Edit Template"
        : "Clone Template";

  const isCustomTemplate = template?.id.startsWith("custom-") || mode === "create";
  const hasDraftForTemplate = templateId && hasDraft(templateId);

  return (
    <ClientDialog open={open} onOpenChange={onOpenChange}>
      <ClientDialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <ClientDialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <ClientDialogTitle className="flex items-center gap-2">
                <IconSparkles className="size-5" />
                {dialogTitle}
              </ClientDialogTitle>
              <ClientDialogDescription>
                {mode === "create" && "Create a reusable configuration template for your system."}
                {mode === "edit" && "Modify the template configuration. This will affect future applications."}
                {mode === "clone" && "Create a copy of this template with your own customizations."}
              </ClientDialogDescription>
            </div>

            {/* Draft indicator */}
            {hasDraftForTemplate && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <IconDeviceFloppy className="size-3" />
                Draft
              </Badge>
            )}
          </div>
        </ClientDialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor" className="flex items-center gap-2">
              Template Editor
              {hasUnsavedChanges && (
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
              )}
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
                    <div className="grid md:grid-cols-2 gap-4 items-start">
                      {/* Template ID */}
                      <FormField
                        control={form.control}
                        name="id"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Template ID</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="my-custom-template"
                                className="font-mono"
                                disabled={mode === "edit"}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
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
                          <FormItem className="flex flex-col">
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
                            enumValues: undefined,
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
                                        <ClientSelectItem value="enum">Enum</ClientSelectItem>
                                      </ClientSelectContent>
                                    </ClientSelect>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            {/* Enum values (when type is enum) */}
                            {form.watch(`configs.${index}.validationType`) === "enum" && (
                              <FormField
                                control={form.control}
                                name={`configs.${index}.enumValues`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Enum values</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        value={field.value ?? ""}
                                        placeholder="value1, value2, value3"
                                        className="font-mono text-sm"
                                      />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                      Comma-separated options
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}

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
                {mode === "edit" && !isCustomTemplate && (
                  <Alert variant="destructive">
                    <IconAlertCircle className="size-4" />
                    <AlertDescription>
                      System templates are immutable. Use &ldquo;Save as New&rdquo; to create a customized version.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Actions */}
                <ClientDialogFooter className="flex-col sm:flex-row gap-2">
                  {/* Left side actions */}
                  <div className="flex gap-2">
                    {hasDraftForTemplate && (
                      <ClientDropdownMenu>
                        <ClientDropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <IconDeviceFloppy className="mr-2 size-4" />
                            Draft
                          </Button>
                        </ClientDropdownMenuTrigger>
                        <ClientDropdownMenuContent>
                          <ClientDropdownMenuItem onClick={handleSaveDraft}>
                            <IconDeviceFloppy className="mr-2 size-4" />
                            Save Draft
                          </ClientDropdownMenuItem>
                          <ClientDropdownMenuItem
                            onClick={() => setShowDeleteDialog(true)}
                            className="text-red-600"
                          >
                            <IconTrash className="mr-2 size-4" />
                            Delete Draft
                          </ClientDropdownMenuItem>
                        </ClientDropdownMenuContent>
                      </ClientDropdownMenu>
                    )}

                    {mode === "edit" && isCustomTemplate && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowArchiveDialog(true)}
                      >
                        Archive
                      </Button>
                    )}
                  </div>

                  {/* Right side actions */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (hasUnsavedChanges) {
                          // Could show unsaved changes warning
                        }
                        onOpenChange(false);
                      }}
                    >
                      <IconX className="mr-2 size-4" />
                      Cancel
                    </Button>

                    <ClientDropdownMenu>
                      <ClientDropdownMenuTrigger asChild>
                        <Button variant="outline">
                          <IconCopy className="mr-2 size-4" />
                          Save Options
                        </Button>
                      </ClientDropdownMenuTrigger>
                      <ClientDropdownMenuContent>
                        <ClientDropdownMenuItem onClick={handleSaveDraft}>
                          <IconDeviceFloppy className="mr-2 size-4" />
                          Save as Draft
                        </ClientDropdownMenuItem>
                        <ClientDropdownMenuItem onClick={() => setShowSaveAsNewDialog(true)}>
                          <IconCopy className="mr-2 size-4" />
                          Save as New Template
                        </ClientDropdownMenuItem>
                      </ClientDropdownMenuContent>
                    </ClientDropdownMenu>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <IconLoader2 className="mr-2 size-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <IconSparkles className="mr-2 size-4" />
                          {mode === "create" ? "Create Template" : mode === "edit" ? "Update Template" : "Clone Template"}
                        </>
                      )}
                    </Button>
                  </div>
                </ClientDialogFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="examples" className="mt-4">
            <SearchableTemplateExamples
              onExampleSelect={handleExampleSelect}
              maxVisible={12}
              showCategories={true}
            />
          </TabsContent>
        </Tabs>

        {/* Save as New Confirmation */}
        <DangerZoneConfirm
          open={showSaveAsNewDialog}
          onOpenChange={setShowSaveAsNewDialog}
          onConfirm={handleSaveAsNew}
          title="Save as New Template"
          description={`Create a new template based on "${templateName}" with your current modifications.`}
          confirmWord="CREATE"
          confirmLabel="Type CREATE to confirm"
          actionLabel="Create New Template"
          variant="warning"
        />

        {/* Archive Confirmation */}
        <DangerZoneConfirm
          open={showArchiveDialog}
          onOpenChange={setShowArchiveDialog}
          onConfirm={handleArchive}
          title="Archive Template"
          description={`This will archive "${templateName}". The template will no longer appear in the active list but can be restored later.`}
          confirmWord="ARCHIVE"
          confirmLabel="Type ARCHIVE to confirm"
          actionLabel="Archive Template"
          variant="warning"
        />

        {/* Delete Draft Confirmation */}
        <DangerZoneConfirm
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleDeleteDraft}
          title="Delete Draft"
          description={`This will permanently delete the draft for "${templateName}". This action cannot be undone.`}
          confirmWord="DELETE"
          confirmLabel="Type DELETE to confirm"
          actionLabel="Delete Draft"
          variant="destructive"
        />
      </ClientDialogContent>
    </ClientDialog>
  );
}
