"use client";

/**
 * Dashboard Error Boundary
 * Catches and handles errors in dashboard components.
 */

import * as React from "react";
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";
import { Button } from "@afenda/shadcn";
import { getStatusColor, getStatusBgColor } from "./colorUtils";

interface DashboardErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

interface DashboardErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class DashboardErrorBoundary extends React.Component<DashboardErrorBoundaryProps, DashboardErrorBoundaryState> {
  constructor(props: DashboardErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): DashboardErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Dashboard Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultDashboardError;
      return <FallbackComponent error={this.state.error} reset={() => this.setState({ hasError: false, error: null })} />;
    }

    return this.props.children;
  }
}

function DefaultDashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-md">
        <div className={`flex items-center justify-center w-16 h-16 rounded-full ${getStatusBgColor("error")} mb-4`}>
          <IconAlertTriangle className={`h-8 w-8 ${getStatusColor("error")}`} />
        </div>
        <h2 className={`text-xl font-semibold ${getStatusColor("error")}`}>Dashboard Error</h2>
        <p className="text-muted-foreground">
          Failed to load dashboard data. Please try again or contact support if the problem persists.
        </p>
        
        <div className="space-y-2">
          <details className="text-left">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              View Error Details
            </summary>
            <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-auto max-h-32">
              {error.message}
              {error.stack && `\n\nStack trace:\n${error.stack}`}
            </pre>
          </details>
        </div>
        
        <div className="flex gap-2 justify-center">
          <Button onClick={reset} variant="default">
            <IconRefresh className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline">
            Reload Page
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground mt-4">
          If this error continues, please check the system health and contact your administrator.
        </div>
      </div>
    </div>
  );
}
