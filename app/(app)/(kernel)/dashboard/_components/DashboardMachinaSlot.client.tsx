"use client";

/**
 * Dashboard slot for Machina panel: listens for FAB event and ?machina=1, opens panel.
 */

import * as React from "react";
import { MACHINA_OPEN_EVENT } from "@afenda/shared/constants";
import { MachinaRecommendationPanel } from "./MachinaRecommendationPanel";

interface DashboardMachinaSlotProps {
  systemHealth: {
    summary?: { degraded?: number; down?: number };
    status?: string;
  } | null;
  recentAudit: Array<{ eventType: string; id: string }>;
  initialOpenFromQuery?: boolean;
}

export function DashboardMachinaSlot({
  systemHealth,
  recentAudit,
  initialOpenFromQuery = false,
}: DashboardMachinaSlotProps) {
  const [openFromExternal, setOpenFromExternal] = React.useState(initialOpenFromQuery);

  React.useEffect(() => {
    const handler = () => setOpenFromExternal(true);
    window.addEventListener(MACHINA_OPEN_EVENT, handler);
    return () => window.removeEventListener(MACHINA_OPEN_EVENT, handler);
  }, []);

  return (
    <MachinaRecommendationPanel
      systemHealth={systemHealth}
      recentAudit={recentAudit}
      mode="passive"
      openFromExternal={openFromExternal}
    />
  );
}
