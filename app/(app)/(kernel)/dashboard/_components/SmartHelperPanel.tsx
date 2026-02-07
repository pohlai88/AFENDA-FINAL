"use client";

/**
 * Smart Helper Panel
 * Contextual help and recommendations based on system state
 */

import * as React from "react";
import { IconInfoCircle, IconAlertTriangle, IconCheck, IconX } from "@tabler/icons-react";
import { Alert, AlertDescription, AlertTitle, Button } from "@afenda/shadcn";

interface SmartHelperPanelProps {
  systemHealth: {
    summary?: {
      up?: number;
      degraded?: number;
      down?: number;
    };
    status?: string;
  } | null;
  recentAudit: Array<{
    eventType: string;
    id: string;
  }>;
  healthPercentage: number;
}

export function SmartHelperPanel({
  systemHealth,
  recentAudit,
  healthPercentage,
}: SmartHelperPanelProps) {
  const [isDismissed, setIsDismissed] = React.useState(false);
  
  // Load dismissed state from sessionStorage on mount
  React.useEffect(() => {
    const dismissed = sessionStorage.getItem('dashboard-helper-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);
  
  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('dashboard-helper-dismissed', 'true');
  };
  // Determine the appropriate message based on system state
  const getHelperContent = () => {
    const downServices = systemHealth?.summary?.down || 0;
    const degradedServices = systemHealth?.summary?.degraded || 0;
    const upServices = systemHealth?.summary?.up || 0;
    const totalServices = upServices + degradedServices + downServices;

    // No services registered yet
    if (totalServices === 0) {
      return {
        variant: "default" as const,
        icon: <IconInfoCircle className="h-4 w-4" />,
        title: "Getting Started",
        description: "No services are currently registered. Use the Service Registry to add your services and start monitoring their health.",
      };
    }

    // Critical issues
    if (downServices > 0) {
      return {
        variant: "destructive" as const,
        icon: <IconAlertTriangle className="h-4 w-4" />,
        title: "Action Required",
        description: `${downServices} service${downServices > 1 ? 's are' : ' is'} currently down. Check the System Health section below for details and recommended actions.`,
      };
    }

    // Warning state
    if (degradedServices > 0) {
      return {
        variant: "default" as const,
        icon: <IconInfoCircle className="h-4 w-4" />,
        title: "Performance Notice",
        description: `${degradedServices} service${degradedServices > 1 ? 's are' : ' is'} experiencing degraded performance. Monitor the situation in System Metrics.`,
      };
    }

    // All good - all services are up
    return {
      variant: "default" as const,
      icon: <IconCheck className="h-4 w-4" />,
      title: "All Systems Operational",
      description: `All ${totalServices} service${totalServices > 1 ? 's are' : ' is'} running normally. Use Quick Actions below to manage your workflow.`,
    };
  };

  const content = getHelperContent();
  const totalServices = (systemHealth?.summary?.up || 0) + (systemHealth?.summary?.degraded || 0) + (systemHealth?.summary?.down || 0);

  // Don't show panel if dismissed
  if (isDismissed) {
    return null;
  }
  
  // Don't show panel if everything is optimal and we have services (to reduce clutter)
  if (totalServices > 0 && healthPercentage === 100 && recentAudit.length === 0) {
    return null;
  }
  
  // Only show for critical issues or when no services exist
  const shouldShow = totalServices === 0 || (systemHealth?.summary?.down || 0) > 0;
  
  if (!shouldShow) {
    return null;
  }

  return (
    <Alert variant={content.variant} className="relative">
      <div className="flex items-start gap-3 pr-8">
        {content.icon}
        <div className="flex-1 min-w-0">
          <AlertTitle className="line-clamp-none">{content.title}</AlertTitle>
          <AlertDescription>{content.description}</AlertDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="alert-dismiss-button shrink-0"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
        >
          <IconX className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}
