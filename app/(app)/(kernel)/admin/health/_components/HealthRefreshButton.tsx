"use client";

/**
 * Health Refresh Button
 * Client component for refreshing health data.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { IconRefresh } from "@tabler/icons-react";

import { Button } from "@afenda/shadcn";

export function HealthRefreshButton() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh();
    // Wait a bit for visual feedback
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
    >
      <IconRefresh
        className={`mr-2 size-4 ${isRefreshing ? "animate-spin" : ""}`}
      />
      {isRefreshing ? "Refreshing..." : "Refresh"}
    </Button>
  );
}
