"use client";

/**
 * Configuration Template Browser
 * Browse and select templates by category with search.
 */

import * as React from "react";
import { IconSearch, IconCheck } from "@tabler/icons-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@afenda/shadcn";
import { cn } from "@afenda/shadcn/lib/utils";

import type { ConfigTemplate, TemplateCategory } from "@afenda/orchestra/zod";

export interface ConfigTemplateBrowserProps {
  templates: ConfigTemplate[];
  categories: TemplateCategory[];
  selectedTemplateId: string | null;
  onSelectTemplate: (templateId: string) => void;
}

export function ConfigTemplateBrowser({
  templates,
  categories,
  selectedTemplateId,
  onSelectTemplate,
}: ConfigTemplateBrowserProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter templates by search query
  const filteredTemplates = React.useMemo(() => {
    if (!searchQuery) return templates;

    const query = searchQuery.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
    );
  }, [templates, searchQuery]);

  // Group templates by category
  const templatesByCategory = React.useMemo(() => {
    const grouped: Record<TemplateCategory, ConfigTemplate[]> = {
      System: [],
      Tenant: [],
      Service: [],
      Compliance: [],
    };

    filteredTemplates.forEach((template) => {
      grouped[template.category].push(template);
    });

    return grouped;
  }, [filteredTemplates]);

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Category Tabs */}
      <Tabs defaultValue="System">
        <TabsList className="grid w-full grid-cols-4">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category} className="space-y-4 mt-4">
            {templatesByCategory[category].length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No templates found in this category
              </p>
            ) : (
              templatesByCategory[category].map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={selectedTemplateId === template.id}
                  onSelect={() => onSelectTemplate(template.id)}
                />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

interface TemplateCardProps {
  template: ConfigTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:border-primary",
        isSelected && "border-primary bg-primary/5"
      )}
      onClick={onSelect}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">{template.name}</CardTitle>
            <CardDescription className="mt-1">
              {template.description}
            </CardDescription>
          </div>
          {isSelected && (
            <IconCheck className="size-5 text-primary shrink-0 ml-2" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{template.configs.length} settings</Badge>
          <Badge variant="outline">{template.category}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
