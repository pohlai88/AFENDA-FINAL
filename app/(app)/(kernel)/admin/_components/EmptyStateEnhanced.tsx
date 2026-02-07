"use client";

/**
 * Enhanced Empty State Component
 * Reusable empty state with educational content and actionable guidance.
 */

import * as React from "react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from "@afenda/shadcn";

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "outline";
  icon?: React.ReactNode;
}

export interface EmptyStateEnhancedProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
  tips?: string[];
  recommendations?: string[];
}

export function EmptyStateEnhanced({
  icon,
  title,
  description,
  actions = [],
  tips = [],
  recommendations = [],
}: EmptyStateEnhancedProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 max-w-2xl mx-auto">
      {/* Icon */}
      <div className="relative">
        {icon}
      </div>

      {/* Heading */}
      <h3 className="mt-6 text-lg font-semibold text-center">
        {title}
      </h3>

      {/* Description */}
      <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
        {description}
      </p>

      {/* Tips */}
      {tips.length > 0 && (
        <Card className="mt-6 w-full border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Quick Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Badge variant="outline" className="mt-0.5 shrink-0">
                    {index + 1}
                  </Badge>
                  <span className="text-muted-foreground">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="mt-6 w-full border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-primary shrink-0">✓</span>
                  <span className="text-muted-foreground">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {actions.map((action, index) => (
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
    </div>
  );
}
