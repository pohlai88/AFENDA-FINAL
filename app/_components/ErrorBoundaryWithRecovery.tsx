"use client";

/**
 * Enhanced Error Boundary with Recovery Actions
 * Provides contextual error messages and actionable recovery options.
 * Uses routes from @afenda/shared/constants (no magic strings).
 * Reports via onError callback; production-safe (no console.* in report path).
 *
 * @layer app/components
 */

import * as React from "react";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@afenda/shadcn";
import { routes } from "@afenda/shared/constants";

// Icons - using inline SVG to avoid tabler import restriction
const IconAlertTriangle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const IconRefresh = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const IconHome = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const IconBug = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
  </svg>
);

interface RecoveryAction {
  label: string;
  icon?: React.ReactNode;
  handler: () => void;
  variant?: "default" | "outline" | "destructive";
}

export interface ErrorInfo {
  componentStack: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export interface ErrorBoundaryWithRecoveryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Called when an error is caught; use for logging/error tracking (e.g. Sentry). */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * Get contextual error message and recovery actions based on error type.
 */
function getErrorContext(
  error: Error,
  options?: { onReport?: () => void }
): {
  title: string;
  message: string;
  actions: RecoveryAction[];
} {
  const errorMessage = error.message.toLowerCase();
  const onReport = options?.onReport;

  // Network/API errors
  if (errorMessage.includes("fetch") || errorMessage.includes("network")) {
    return {
      title: "Connection Error",
      message: "Unable to connect to the server. Please check your internet connection and try again.",
      actions: [
        {
          label: "Retry",
          icon: <IconRefresh className="size-4" />,
          handler: () => window.location.reload(),
          variant: "default",
        },
        {
          label: "Go Home",
          icon: <IconHome className="size-4" />,
          handler: () => window.location.href = routes.ui.orchestra.dashboard(),
          variant: "outline",
        },
      ],
    };
  }

  // Authentication errors
  if (errorMessage.includes("auth") || errorMessage.includes("unauthorized")) {
    return {
      title: "Authentication Error",
      message: "Your session may have expired. Please sign in again to continue.",
      actions: [
        {
          label: "Sign In",
          handler: () => window.location.href = routes.ui.auth.login(),
          variant: "default",
        },
        {
          label: "Go Home",
          icon: <IconHome className="size-4" />,
          handler: () => window.location.href = routes.ui.marketing.home(),
          variant: "outline",
        },
      ],
    };
  }

  // Permission errors
  if (errorMessage.includes("permission") || errorMessage.includes("forbidden")) {
    return {
      title: "Permission Denied",
      message: "You don't have permission to access this resource. Contact your administrator if you believe this is an error.",
      actions: [
        {
          label: "Go Back",
          handler: () => window.history.back(),
          variant: "default",
        },
        {
          label: "Go Home",
          icon: <IconHome className="size-4" />,
          handler: () => window.location.href = routes.ui.orchestra.dashboard(),
          variant: "outline",
        },
      ],
    };
  }

  // Data/validation errors
  if (errorMessage.includes("invalid") || errorMessage.includes("validation")) {
    return {
      title: "Invalid Data",
      message: "The data provided is invalid. Please check your input and try again.",
      actions: [
        {
          label: "Try Again",
          icon: <IconRefresh className="size-4" />,
          handler: () => window.location.reload(),
          variant: "default",
        },
        {
          label: "Go Back",
          handler: () => window.history.back(),
          variant: "outline",
        },
      ],
    };
  }

  // Timeout errors
  if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
    return {
      title: "Request Timeout",
      message: "The request took too long to complete. The server might be experiencing high load.",
      actions: [
        {
          label: "Retry",
          icon: <IconRefresh className="size-4" />,
          handler: () => window.location.reload(),
          variant: "default",
        },
        {
          label: "Go Home",
          icon: <IconHome className="size-4" />,
          handler: () => window.location.href = routes.ui.orchestra.dashboard(),
          variant: "outline",
        },
      ],
    };
  }

  // Generic error
  return {
    title: "Something Went Wrong",
    message: "An unexpected error occurred. Our team has been notified and is working on a fix.",
    actions: [
      {
        label: "Reload Page",
        icon: <IconRefresh className="size-4" />,
        handler: () => window.location.reload(),
        variant: "default",
      },
      {
        label: "Go Home",
        icon: <IconHome className="size-4" />,
        handler: () => { window.location.href = routes.ui.orchestra.dashboard(); },
        variant: "outline",
      },
      {
        label: "Report Issue",
        icon: <IconBug className="size-4" />,
        handler: () => {
          toast.info(
            "Thank you for reporting this issue. Our team will investigate.",
            { duration: 5000 }
          );
          onReport?.();
        },
        variant: "outline",
      },
    ],
  };
}

export class ErrorBoundaryWithRecovery extends React.Component<
  ErrorBoundaryWithRecoveryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryWithRecoveryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const context = getErrorContext(this.state.error, {
        onReport: () =>
          this.props.onError?.(this.state.error!, this.state.errorInfo!),
      });

      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-destructive/10 p-3">
                  <IconAlertTriangle className="size-6 text-destructive" />
                </div>
                <div>
                  <CardTitle>{context.title}</CardTitle>
                  <CardDescription>{context.message}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === "development" && (
                <details className="rounded-lg border p-4 text-sm">
                  <summary className="cursor-pointer font-medium mb-2">
                    Technical Details (Development Only)
                  </summary>
                  <div className="space-y-2 text-muted-foreground">
                    <div>
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="mt-1 overflow-auto text-xs bg-muted p-2 rounded">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 overflow-auto text-xs bg-muted p-2 rounded">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Recovery Actions */}
              <div className="flex flex-wrap gap-2">
                {context.actions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant || "default"}
                    onClick={action.handler}
                    className="gap-2"
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                ))}
              </div>

              {/* Help Text */}
              <p className="text-sm text-muted-foreground">
                If this problem persists, please contact support with the error details above.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
