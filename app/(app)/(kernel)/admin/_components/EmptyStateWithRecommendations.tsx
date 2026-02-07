"use client";

/**
 * Empty State with Smart Recommendations
 * Context-aware empty state that provides role-based actions and next steps.
 * 
 * @domain kernel
 * @layer ui/component
 */

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@afenda/shadcn";

export interface SmartAction {
  label: string;
  description?: string;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "outline" | "secondary";
  icon?: React.ReactNode;
  role?: "admin" | "user" | "viewer" | "all";
}

export interface NextStep {
  title: string;
  description: string;
  action?: SmartAction;
  completed?: boolean;
}

export interface EmptyStateWithRecommendationsProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actions?: SmartAction[];
  tips?: string[];
  nextSteps?: NextStep[];
  userRole?: "admin" | "user" | "viewer";
}

export function EmptyStateWithRecommendations({
  icon,
  title,
  description,
  actions = [],
  tips = [],
  nextSteps = [],
  userRole = "admin",
}: EmptyStateWithRecommendationsProps) {
  // Filter actions based on user role
  const availableActions = actions.filter(
    (action) => !action.role || action.role === "all" || action.role === userRole
  );

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 max-w-3xl mx-auto">
      {/* Icon */}
      <div className="relative mb-6">
        {icon}
      </div>

      {/* Heading */}
      <h3 className="text-xl font-semibold text-center">
        {title}
      </h3>

      {/* Description */}
      <p className="mt-3 text-sm text-muted-foreground text-center max-w-lg">
        {description}
      </p>

      {/* Primary Actions */}
      {availableActions.length > 0 && (
        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {availableActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || "default"}
              size="lg"
              className="gap-2"
              onClick={action.onClick}
              asChild={!!action.href}
            >
              {action.href ? (
                <Link href={action.href}>
                  {action.icon}
                  {action.label}
                </Link>
              ) : (
                <>
                  {action.icon}
                  {action.label}
                </>
              )}
            </Button>
          ))}
        </div>
      )}

      {/* What's Next Section */}
      {nextSteps.length > 0 && (
        <Card className="mt-8 w-full border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="text-purple-600 dark:text-purple-400">→</span>
              What&apos;s Next?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nextSteps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${step.completed
                      ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20"
                      : "border-border bg-background"
                    }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {step.completed ? (
                      <div className="size-5 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="size-5 flex items-center justify-center p-0">
                        {index + 1}
                      </Badge>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium">{step.title}</h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {step.description}
                    </p>
                    {step.action && !step.completed && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 gap-1"
                        onClick={step.action.onClick}
                        asChild={!!step.action.href}
                      >
                        {step.action.href ? (
                          <Link href={step.action.href}>
                            {step.action.icon}
                            {step.action.label}
                          </Link>
                        ) : (
                          <>
                            {step.action.icon}
                            {step.action.label}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Tips */}
      {tips.length > 0 && (
        <Card className="mt-6 w-full border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-base">💡 Quick Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">•</span>
                  <span className="text-muted-foreground">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
