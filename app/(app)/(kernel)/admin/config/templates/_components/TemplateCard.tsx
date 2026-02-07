import * as React from "react";
import {
  IconSparkles,
  IconLock,
  IconInfoCircle,
  IconEdit,
  IconCopy,
} from "@tabler/icons-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from "@afenda/shadcn";

import type { ConfigTemplate } from "@afenda/orchestra/zod";

const CATEGORY_ICONS = {
  System: () => null,
  Tenant: () => null,
  Service: () => null,
  Compliance: () => null,
};

const CATEGORY_COLORS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  System: "default",
  Tenant: "secondary",
  Service: "outline",
  Compliance: "destructive",
};

export function TemplateCard({
  template,
  isSelected,
  onPreview,
  onApply,
  onEdit,
  onClone,
}: {
  template: ConfigTemplate;
  isSelected: boolean;
  onPreview: () => void;
  onApply: () => void;
  onEdit?: () => void;
  onClone?: () => void;
}) {
  const Icon = CATEGORY_ICONS[template.category as keyof typeof CATEGORY_ICONS];
  const isCustom = template.id.startsWith("custom-");

  return (
    <Card
      className={`group transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            <div className="mt-0.5 p-2 rounded-md bg-muted size-8 flex items-center justify-center">
              <Icon />
            </div>
            <div className="space-y-1 flex-1">
              <CardTitle className="text-base leading-tight flex items-center gap-2">
                {template.name}
                {!isCustom && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <IconLock className="size-3" />
                    System
                  </Badge>
                )}
                {isCustom && (
                  <Badge variant="outline" className="text-xs">
                    Custom
                  </Badge>
                )}
              </CardTitle>
              <Badge
                variant={CATEGORY_COLORS[template.category as keyof typeof CATEGORY_COLORS] || "outline"}
              >
                {template.category}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <CardDescription className="text-sm line-clamp-2">
          {template.description}
        </CardDescription>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <IconSparkles className="size-3" />
          <span>{template.configs.length} configuration{template.configs.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onPreview}
          >
            <IconInfoCircle className="mr-1.5 size-4" />
            Preview
          </Button>
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
            >
              <IconEdit className="mr-1.5 size-4" />
              Edit
            </Button>
          )}
          {onClone && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClone}
            >
              <IconCopy className="mr-1.5 size-4" />
              Clone
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={onApply}
          >
            Apply
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
