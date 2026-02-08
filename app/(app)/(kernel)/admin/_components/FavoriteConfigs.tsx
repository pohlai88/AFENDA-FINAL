"use client";

/**
 * Favorite Configs
 * Pin and manage favorite configuration keys for quick access.
 * 
 * @domain kernel
 * @layer ui/component
 */

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@afenda/shadcn";
import { routes } from "@afenda/shared/constants";
import { logger } from "@afenda/shared";

interface ConfigItem {
  key: string;
  value: unknown;
  scope: string;
  isPinned: boolean;
}

interface FavoriteConfigsProps {
  maxItems?: number;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  return JSON.stringify(value);
}

export function FavoriteConfigs({ maxItems = 5 }: FavoriteConfigsProps) {
  const [favorites, setFavorites] = React.useState<ConfigItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchFavorites = async () => {
      setIsLoading(true);
      try {
        // Mock pinned configs
        const mockFavorites: ConfigItem[] = [
          { key: "global.feature.enabled", value: true, scope: "global", isPinned: true },
          { key: "app.timeout.seconds", value: 30, scope: "application", isPinned: true },
          { key: "db.connection.pool.size", value: 10, scope: "database", isPinned: true },
        ];

        setFavorites(mockFavorites.slice(0, maxItems));
      } catch (error) {
        logger.error("Failed to fetch favorites", error as Error, { component: "FavoriteConfigs" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [maxItems]);

  const handleUnpin = (key: string) => {
    setFavorites((prev) => prev.filter((f) => f.key !== key));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pinned Configurations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (favorites.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pinned Configurations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No pinned configurations yet. Pin configs for quick access.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Pinned Configurations</CardTitle>
          <Link href={routes.ui.admin.config()}>
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {favorites.map((config) => (
            <div
              key={config.key}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-sm font-mono font-medium">{config.key}</code>
                  <Badge variant="secondary" className="text-xs">{config.scope}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  {formatValue(config.value)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUnpin(config.key)}
                className="shrink-0"
              >
                📌
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
