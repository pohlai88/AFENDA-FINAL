"use client";

/**
 * Enhanced Config Create Dialog
 * Steve Jobs-inspired: Clear, Simple, Powerful
 * Responsive: Uses Drawer on mobile, Dialog on desktop
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { IconPlus, IconCheck, IconAlertCircle, IconSparkles } from "@tabler/icons-react";
import { toast } from "sonner";

import {
  Button,
  ClientDialog,
  ClientDialogClose,
  ClientDialogContent,
  ClientDialogDescription,
  ClientDialogFooter,
  ClientDialogHeader,
  ClientDialogTitle,
  ClientDialogTrigger,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Input,
  Label,
  Textarea,
  ClientSelect,
  ClientSelectContent,
  ClientSelectItem,
  ClientSelectTrigger,
  ClientSelectValue,
  Alert,
  AlertDescription,
  Card,
  CardContent,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@afenda/shadcn";
import { useIsMobile } from "@afenda/shadcn/hooks/use-mobile";
import { routes } from "@afenda/shared/constants";

export interface ConfigCreateDialogEnhancedProps {
  variant?: "default" | "outline";
  className?: string;
}

/**
 * Example configurations for quick reference
 */
const EXAMPLES = {
  global: [
    { key: "system.name", value: "AFENDA Production", description: "System display name" },
    { key: "system.timezone", value: "Asia/Singapore", description: "Default timezone" },
    { key: "features.beta_enabled", value: "false", description: "Enable beta features" },
  ],
  tenant: [
    { key: "display_name", value: "Acme Corp", description: "Organization name" },
    { key: "max_users", value: "100", description: "Maximum user limit" },
    { key: "locale", value: "en-US", description: "Preferred language" },
  ],
  service: [
    { key: "api.timeout_ms", value: "5000", description: "API request timeout" },
    { key: "cache.ttl_seconds", value: "3600", description: "Cache time-to-live" },
    { key: "storage.provider", value: "s3", description: "Storage backend type" },
  ],
};

/**
 * Value type detection and formatting
 */
function detectValueType(value: string): { type: string; parsed: unknown; valid: boolean } {
  // Boolean
  if (value === "true" || value === "false") {
    return { type: "boolean", parsed: value === "true", valid: true };
  }

  // Number
  if (!isNaN(Number(value)) && value.trim() !== "") {
    return { type: "number", parsed: Number(value), valid: true };
  }

  // JSON Object/Array
  if ((value.startsWith("{") && value.endsWith("}")) || (value.startsWith("[") && value.endsWith("]"))) {
    try {
      const parsed = JSON.parse(value);
      return { type: Array.isArray(parsed) ? "array" : "object", parsed, valid: true };
    } catch {
      return { type: "json", parsed: null, valid: false };
    }
  }

  // String (default)
  return { type: "string", parsed: value, valid: true };
}

export function ConfigCreateDialogEnhanced({ variant = "default", className }: ConfigCreateDialogEnhancedProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("manual");
  const [key, setKey] = React.useState("");
  const [value, setValue] = React.useState("");
  const [scope, setScope] = React.useState("global");
  const [description, setDescription] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fullKey = `${scope}.${key}`;
  const valueAnalysis = React.useMemo(() => detectValueType(value), [value]);
  const isValid = key.length > 0 && value.length > 0 && valueAnalysis.valid;

  const handleExampleSelect = (example: typeof EXAMPLES.global[0]) => {
    setKey(example.key);
    setValue(String(example.value));
    setDescription(example.description);
    // Switch to manual tab after selecting example
    setActiveTab("manual");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);
    setError(null);

    const toastId = toast.loading(`Creating ${fullKey}...`);

    try {
      const response = await fetch(routes.api.orchestra.configKey(fullKey), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: valueAnalysis.parsed,
          description: description || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message ?? "Failed to create configuration");
      }

      toast.success(
        <div className="flex items-center gap-2">
          <IconCheck className="size-4" />
          <span>Configuration created</span>
        </div>,
        { id: toastId }
      );

      // Reset and close
      setKey("");
      setValue("");
      setScope("global");
      setDescription("");
      setOpen(false);

      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create configuration";
      toast.error(errorMessage, { id: toastId });
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const TriggerButton = (
    <Button variant={variant} size="sm" className={className}>
      <IconPlus className="mr-2 size-4" />
      New Configuration
    </Button>
  );

  const FormContent = (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        <TabsTrigger value="examples">
          <IconSparkles className="mr-2 size-4" />
          Examples
        </TabsTrigger>
      </TabsList>

      <TabsContent value="manual" className="space-y-4 pt-4">
        <form onSubmit={handleSubmit} className="space-y-4" id="config-create-form">
          {/* Scope Selection */}
          <div className="space-y-2">
            <Label htmlFor="scope">Scope</Label>
            <ClientSelect value={scope} onValueChange={setScope}>
              <ClientSelectTrigger>
                <ClientSelectValue placeholder="Select scope" />
              </ClientSelectTrigger>
              <ClientSelectContent>
                <ClientSelectItem value="global">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">
                      Global
                    </Badge>
                    <span className="text-muted-foreground text-xs">System-wide settings</span>
                  </div>
                </ClientSelectItem>
                <ClientSelectItem value="tenant">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      Tenant
                    </Badge>
                    <span className="text-muted-foreground text-xs">Organization-specific</span>
                  </div>
                </ClientSelectItem>
                <ClientSelectItem value="service">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Service
                    </Badge>
                    <span className="text-muted-foreground text-xs">Service-level config</span>
                  </div>
                </ClientSelectItem>
              </ClientSelectContent>
            </ClientSelect>
          </div>

          {/* Key Name */}
          <div className="space-y-2">
            <Label htmlFor="key">Key Name</Label>
            <Input
              id="key"
              value={key}
              onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
              className="font-mono"
              placeholder="feature.enabled"
            />
            {key && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Full key:</span>
                <code className="bg-muted px-2 py-0.5 rounded font-mono">{fullKey}</code>
              </div>
            )}
          </div>

          {/* Value */}
          <div className="space-y-2">
            <Label htmlFor="value">Value</Label>
            <Textarea
              id="value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="font-mono min-h-[100px]"
              placeholder='true, 123, "text", or {"key": "value"}'
            />
            {value && (
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={valueAnalysis.valid ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800" : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800"}
                >
                  {valueAnalysis.valid ? <IconCheck className="mr-1 size-3" /> : <IconAlertCircle className="mr-1 size-3" />}
                  Type: {valueAnalysis.type}
                </Badge>
                {valueAnalysis.valid && (
                  <span className="text-xs text-muted-foreground">
                    Parsed as: {JSON.stringify(valueAnalysis.parsed)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this configuration controls..."
            />
          </div>

          {/* Preview Card */}
          {isValid && (
            <Card className="border-dashed">
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="font-medium">Preview</div>
                  <div className="grid gap-1 text-xs">
                    <div className="flex gap-2">
                      <span className="text-muted-foreground w-20">Key:</span>
                      <code className="font-mono">{fullKey}</code>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground w-20">Value:</span>
                      <code className="font-mono">{JSON.stringify(valueAnalysis.parsed)}</code>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground w-20">Type:</span>
                      <Badge variant="secondary" className="h-5 text-xs">{valueAnalysis.type}</Badge>
                    </div>
                    {description && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground w-20">Description:</span>
                        <span>{description}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Alert variant="destructive">
              <IconAlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </form>
      </TabsContent>

      <TabsContent value="examples" className="space-y-4 pt-4">{/* Examples tab content continues below */}
            <Alert className="border-primary/20 bg-primary/5">
              <IconSparkles className="size-4" />
              <AlertDescription>
                Click any example to auto-fill the form and switch to Manual Entry
              </AlertDescription>
            </Alert>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Badge variant="default">
                    Global
                  </Badge>
                  System-wide settings
                </h4>
                <div className="grid gap-2">
                  {EXAMPLES.global.map((example) => (
                    <Card
                      key={example.key}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleExampleSelect(example)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <code className="text-sm font-mono">{example.key}</code>
                            <p className="text-xs text-muted-foreground">{example.description}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">{example.value}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Badge variant="secondary">
                    Tenant
                  </Badge>
                  Organization-specific
                </h4>
                <div className="grid gap-2">
                  {EXAMPLES.tenant.map((example) => (
                    <Card
                      key={example.key}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => {
                        setScope("tenant");
                        handleExampleSelect(example);
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <code className="text-sm font-mono">{example.key}</code>
                            <p className="text-xs text-muted-foreground">{example.description}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">{example.value}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Badge variant="outline">
                    Service
                  </Badge>
                  Service-level config
                </h4>
                <div className="grid gap-2">
                  {EXAMPLES.service.map((example) => (
                    <Card
                      key={example.key}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => {
                        setScope("service");
                        handleExampleSelect(example);
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <code className="text-sm font-mono">{example.key}</code>
                            <p className="text-xs text-muted-foreground">{example.description}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">{example.value}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      );

      if (isMobile) {
        return (
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>{TriggerButton}</DrawerTrigger>
            <DrawerContent className="max-h-[90vh]">
              <DrawerHeader>
                <DrawerTitle>Create Configuration</DrawerTitle>
                <DrawerDescription>
                  Simple, clear configuration. Automatically audited.
                </DrawerDescription>
              </DrawerHeader>
              <div className="px-4 overflow-y-auto max-h-[calc(90vh-12rem)]">
                {FormContent}
              </div>
              <DrawerFooter className="pt-2">
                <Button
                  form="config-create-form"
                  type="submit"
                  disabled={!isValid || isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Configuration"}
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        );
      }

      return (
        <ClientDialog open={open} onOpenChange={setOpen}>
          <ClientDialogTrigger asChild>{TriggerButton}</ClientDialogTrigger>
          <ClientDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <ClientDialogHeader>
              <ClientDialogTitle>Create Configuration</ClientDialogTitle>
              <ClientDialogDescription>
                Simple, clear configuration. Automatically audited.
              </ClientDialogDescription>
            </ClientDialogHeader>
            {FormContent}
            <ClientDialogFooter>
              <ClientDialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </ClientDialogClose>
              <Button
                form="config-create-form"
                type="submit"
                disabled={!isValid || isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Configuration"}
              </Button>
            </ClientDialogFooter>
          </ClientDialogContent>
        </ClientDialog>
      );
    }
