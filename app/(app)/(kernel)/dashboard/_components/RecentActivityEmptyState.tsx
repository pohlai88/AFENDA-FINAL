"use client";

/**
 * Recent Activity Empty State
 * Displayed when there are no recent audit events.
 */

import * as React from "react";
import { IconHistory, IconClock, IconShield } from "@tabler/icons-react";
import { Button } from "@afenda/shadcn";
import { routes } from "@afenda/shared/constants";

export const RecentActivityEmptyState = React.memo(function RecentActivityEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
        <IconHistory className="h-8 w-8 text-muted-foreground" />
      </div>
      
      <h3 className="text-lg font-semibold mb-2">No Recent Activity</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        No audit events have been recorded yet. System activity will appear here once events start occurring.
      </p>
      
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" asChild>
          <a href={routes.ui.admin.audit()}>
            <IconShield className="mr-2 h-4 w-4" />
            View Audit Log
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href={routes.ui.admin.health()}>
            <IconClock className="mr-2 h-4 w-4" />
            Check System Health
          </a>
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground mt-4">
        Events are automatically tracked and displayed here in chronological order.
      </div>
    </div>
  );
});
