"use client";

/**
 * Refresh button for backup list.
 * Uses router.refresh() to re-run server components (Next.js best practice).
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { IconRefresh } from "@tabler/icons-react";
import { Button } from "@afenda/shadcn";
import { toast } from "sonner";

export function BackupTableRefreshButton() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    toast.success("List refreshed");
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      title="Refresh backup list"
    >
      <IconRefresh className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
      <span className="sr-only">Refresh</span>
    </Button>
  );
}
