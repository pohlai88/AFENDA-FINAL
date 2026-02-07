"use client";

/**
 * Config Template Quick Apply Button
 * Simple button that opens template browser dialog
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { IconTemplate, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";

import {
  Button,
  ClientDialog,
  ClientDialogContent,
  ClientDialogDescription,
  ClientDialogHeader,
  ClientDialogTitle,
  ClientDialogTrigger,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Input,
} from "@afenda/shadcn";
import { routes } from "@afenda/shared/constants";

interface ConfigTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  configs: Array<{
    key: string;
    value: unknown;
    description?: string;
  }>;
}

export function ConfigTemplateQuickApply() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [templates, setTemplates] = React.useState<ConfigTemplate[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [applying, setApplying] = React.useState<string | null>(null);

  // Fetch templates when dialog opens
  React.useEffect(() => {
    if (open && templates.length === 0) {
      fetchTemplates();
    }
  }, [open, templates.length]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(routes.api.orchestra.configTemplatesBff());
      if (!response.ok) throw new Error("Failed to fetch templates");
      const data = await response.json();
      setTemplates(data.data?.templates || []);
    } catch (_err) {
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyTemplate = async (template: ConfigTemplate) => {
    setApplying(template.id);

    try {
      const response = await fetch(
        routes.api.orchestra.configTemplatesOps("apply"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId: template.id }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message ?? "Failed to apply template");
      }

      toast.success(`Applied template: ${template.name}`);
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to apply template");
    } finally {
      setApplying(null);
    }
  };

  const filteredTemplates = templates.filter((template) =>
    searchQuery
      ? template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <ClientDialog open={open} onOpenChange={setOpen}>
      <ClientDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <IconTemplate className="mr-2 size-4" />
          Apply Template
        </Button>
      </ClientDialogTrigger>
      <ClientDialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <ClientDialogHeader>
          <ClientDialogTitle>Apply Configuration Template</ClientDialogTitle>
          <ClientDialogDescription>
            Choose a template to quickly apply pre-configured settings
          </ClientDialogDescription>
        </ClientDialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Search */}
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Templates Grid */}
          {!isLoading && (
            <div className="grid gap-3 md:grid-cols-2">
              {filteredTemplates.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  No templates found
                </div>
              ) : (
                filteredTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className="hover:border-primary transition-colors cursor-pointer"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <CardTitle className="text-base leading-tight">
                            {template.name}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {template.configs.length} settings
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleApplyTemplate(template)}
                          disabled={applying !== null}
                        >
                          {applying === template.id ? (
                            <>
                              <IconLoader2 className="mr-2 size-3 animate-spin" />
                              Applying...
                            </>
                          ) : (
                            "Apply"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </ClientDialogContent>
    </ClientDialog>
  );
}
