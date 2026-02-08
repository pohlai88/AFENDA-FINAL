"use client";

/**
 * Configuration Template Form
 * Dynamic form generation from template schema with validation.
 */

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconCheck, IconX, IconDeviceFloppy } from "@tabler/icons-react";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Switch,
  ClientSelect,
  ClientSelectContent,
  ClientSelectItem,
  ClientSelectTrigger,
  ClientSelectValue,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Alert,
  AlertDescription,
} from "@afenda/shadcn";
import { routes } from "@afenda/shared/constants";
import { logger } from "@afenda/shared";

import type { ConfigTemplate, ConfigField } from "@afenda/orchestra/zod";

export interface ConfigTemplateFormProps {
  template: ConfigTemplate;
  onCancel: () => void;
  onSuccess: () => void;
}

export const ConfigTemplateForm = React.memo<ConfigTemplateFormProps>(function ConfigTemplateForm({
  template,
  onCancel,
  onSuccess,
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSavingDraft, setIsSavingDraft] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Generate Zod schema from template validation rules
  const schema = React.useMemo(() => {
    const shape: Record<string, z.ZodTypeAny> = {};

    template.configs.forEach((field) => {
      let fieldSchema: z.ZodTypeAny;

      switch (field.validation.type) {
        case "string": {
          let stringSchema = z.string();
          if (field.validation.minLength) {
            stringSchema = stringSchema.min(field.validation.minLength);
          }
          if (field.validation.maxLength) {
            stringSchema = stringSchema.max(field.validation.maxLength);
          }
          fieldSchema = stringSchema;
          break;
        }

        case "number": {
          let numberSchema = z.coerce.number();
          if (field.validation.min !== undefined) {
            numberSchema = numberSchema.min(field.validation.min);
          }
          if (field.validation.max !== undefined) {
            numberSchema = numberSchema.max(field.validation.max);
          }
          fieldSchema = numberSchema;
          break;
        }

        case "boolean":
          fieldSchema = z.boolean();
          break;

        case "email":
          fieldSchema = z.string().email();
          break;

        case "url":
          fieldSchema = z.string().url();
          break;

        case "color":
          fieldSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
          break;

        case "timezone":
        case "locale":
          fieldSchema = z.string();
          if (field.validation.type === "locale" && field.validation.enum) {
            fieldSchema = z.enum(field.validation.enum as [string, ...string[]]);
          }
          break;

        case "array":
          fieldSchema = z.array(z.string());
          break;

        case "enum":
          fieldSchema = z.enum(field.validation.enum as [string, ...string[]]);
          break;

        default:
          fieldSchema = z.unknown();
      }

      if (!field.required) {
        fieldSchema = fieldSchema.optional();
      }

      shape[field.key] = fieldSchema;
    });

    return z.object(shape);
  }, [template]);

  // Get default values from template
  const defaultValues = React.useMemo(() => {
    const values: Record<string, unknown> = {};
    template.configs.forEach((field) => {
      values[field.key] = field.value;
    });
    return values;
  }, [template]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSaveDraft = async () => {
    try {
      setIsSavingDraft(true);
      const currentValues = form.getValues();
      
      // Save draft to localStorage
      const draftKey = `config-template-draft-${template.id}`;
      localStorage.setItem(draftKey, JSON.stringify({
        templateId: template.id,
        templateName: template.name,
        values: currentValues,
        savedAt: new Date().toISOString(),
      }));

      // Show success toast
      toast.success("Draft saved", {
        description: `Template "${template.name}" saved as draft`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft");
      toast.error("Failed to save draft");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const onSubmit = async (values: Record<string, unknown>) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(routes.api.orchestra.configTemplatesOps("apply"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template.id,
          values,
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error?.message || "Failed to apply template");
      }

      // Clear draft on successful apply
      const draftKey = `config-template-draft-${template.id}`;
      localStorage.removeItem(draftKey);

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply template");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load draft on mount if exists
  React.useEffect(() => {
    const draftKey = `config-template-draft-${template.id}`;
    const savedDraft = localStorage.getItem(draftKey);
    
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.values) {
          Object.entries(draft.values).forEach(([key, value]) => {
            form.setValue(key as string, value);
          });
          
          // Show info toast
          const savedDate = new Date(draft.savedAt);
          toast.info("Draft loaded", {
            description: `Last saved: ${savedDate.toLocaleString()}`,
          });
        }
      } catch (err) {
        logger.error("Failed to load draft", err as Error, { component: "ConfigTemplateForm", templateId: template.id });
      }
    }
  }, [template.id, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Template Info */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">
              Configure: {template.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {template.description}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="outline">{template.category}</Badge>
              <Badge variant="outline">{template.configs.length} settings</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Form Fields */}
        <div className="space-y-4">
          {template.configs.map((field) => (
            <Card key={field.key}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base font-semibold">
                    {field.description}
                  </FormLabel>
                  {field.required && (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground font-mono">
                  {field.key}
                </p>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name={field.key}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormControl>
                        {renderInputByType(field, formField)}
                      </FormControl>
                      <FormDescription>
                        {getValidationHint(field)}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" role="alert" aria-live="assertive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex justify-between gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSubmitting || isSavingDraft}
            aria-label="Save as draft"
          >
            <IconDeviceFloppy className="mr-2 size-4" aria-hidden="true" />
            {isSavingDraft ? "Saving..." : "Save as Draft"}
          </Button>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting || isSavingDraft}
              aria-label="Cancel template application"
            >
              <IconX className="mr-2 size-4" aria-hidden="true" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isSavingDraft}
              aria-label={isSubmitting ? "Applying template" : "Apply template"}
              aria-busy={isSubmitting}
            >
              <IconCheck className="mr-2 size-4" aria-hidden="true" />
              {isSubmitting ? "Applying..." : "Apply Template"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
});

function renderInputByType(config: ConfigField, field: { value: unknown; onChange: (value: unknown) => void }): React.ReactNode {
  switch (config.validation.type) {
    case "boolean":
      return (
        <div className="flex items-center gap-2">
          <Switch
            checked={field.value as boolean}
            onCheckedChange={field.onChange}
          />
          <span className="text-sm">{field.value ? "Enabled" : "Disabled"}</span>
        </div>
      );

    case "number":
      return (
        <Input
          type="number"
          value={field.value as number}
          onChange={(e) => field.onChange(Number(e.target.value))}
          min={config.validation.min}
          max={config.validation.max}
        />
      );

    case "email":
      return <Input type="email" value={field.value as string} onChange={(e) => field.onChange(e.target.value)} />;

    case "url":
      return <Input type="url" value={field.value as string} onChange={(e) => field.onChange(e.target.value)} />;

    case "color":
      return (
        <div className="flex items-center gap-2">
          <Input type="color" value={field.value as string} onChange={(e) => field.onChange(e.target.value)} className="w-20" />
          <Input type="text" value={field.value as string} onChange={(e) => field.onChange(e.target.value)} className="flex-1 font-mono" />
        </div>
      );

    case "locale":
    case "enum":
      if (config.validation.type === "locale" && config.validation.enum) {
        return (
          <ClientSelect value={field.value as string} onValueChange={field.onChange}>
            <ClientSelectTrigger>
              <ClientSelectValue />
            </ClientSelectTrigger>
            <ClientSelectContent>
              {config.validation.enum.map((option) => (
                <ClientSelectItem key={option} value={option}>
                  {option}
                </ClientSelectItem>
              ))}
            </ClientSelectContent>
          </ClientSelect>
        );
      }
      if (config.validation.type === "enum") {
        return (
          <ClientSelect value={field.value as string} onValueChange={field.onChange}>
            <ClientSelectTrigger>
              <ClientSelectValue />
            </ClientSelectTrigger>
            <ClientSelectContent>
              {config.validation.enum.map((option) => (
                <ClientSelectItem key={option} value={option}>
                  {option}
                </ClientSelectItem>
              ))}
            </ClientSelectContent>
          </ClientSelect>
        );
      }
      return <Input value={field.value as string} onChange={(e) => field.onChange(e.target.value)} />;

    case "array":
      return (
        <Input
          {...field}
          value={Array.isArray(field.value) ? field.value.join(", ") : ""}
          onChange={(e) => {
            const value = e.target.value.split(",").map((v) => v.trim());
            field.onChange(value);
          }}
          placeholder="Comma-separated values"
        />
      );

    default:
      return <Input value={field.value as string} onChange={(e) => field.onChange(e.target.value)} />;
  }
}

function getValidationHint(field: ConfigField): string {
  const { validation } = field;

  switch (validation.type) {
    case "string":
      if (validation.minLength && validation.maxLength) {
        return `Length: ${validation.minLength}-${validation.maxLength} characters`;
      }
      if (validation.minLength) {
        return `Minimum ${validation.minLength} characters`;
      }
      if (validation.maxLength) {
        return `Maximum ${validation.maxLength} characters`;
      }
      return "Text value";

    case "number":
      if (validation.min !== undefined && validation.max !== undefined) {
        return `Range: ${validation.min} to ${validation.max}`;
      }
      if (validation.min !== undefined) {
        return `Minimum: ${validation.min}`;
      }
      if (validation.max !== undefined) {
        return `Maximum: ${validation.max}`;
      }
      return "Numeric value";

    case "boolean":
      return "Toggle on/off";

    case "email":
      return "Valid email address";

    case "url":
      return "Valid URL (e.g., https://example.com)";

    case "color":
      return "Hex color code (e.g., #3b82f6)";

    case "timezone":
      return "Timezone identifier (e.g., Asia/Singapore)";

    case "locale":
      if (validation.enum) {
        return `Options: ${validation.enum.join(", ")}`;
      }
      return "Locale code";

    case "array":
      return "Comma-separated list";

    case "enum":
      return `Options: ${validation.enum.join(", ")}`;

    default:
      return "";
  }
}
