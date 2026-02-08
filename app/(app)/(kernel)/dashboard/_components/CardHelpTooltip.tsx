"use client";

/**
 * Card Help Tooltip Component
 * Provides contextual help for dashboard cards with "?" icon.
 */

import * as React from "react";
import { IconHelpCircle } from "@tabler/icons-react";
import {
  ClientTooltip,
  ClientTooltipContent,
  ClientTooltipProvider,
  ClientTooltipTrigger,
} from "@afenda/shadcn";

export interface HelpContent {
  title: string;
  description: string;
  details?: string[];
  learnMoreUrl?: string;
}

export interface CardHelpTooltipProps {
  content: HelpContent;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

export const CardHelpTooltip = React.memo(function CardHelpTooltip({ content, side = "top", align = "center" }: CardHelpTooltipProps) {
  return (
    <ClientTooltipProvider delayDuration={300}>
      <ClientTooltip>
        <ClientTooltipTrigger asChild>
          <button
            className="inline-flex items-center justify-center rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label={`Get help with ${content.title}`}
          >
            <IconHelpCircle className="h-4 w-4" />
          </button>
        </ClientTooltipTrigger>
        <ClientTooltipContent side={side} align={align} className="max-w-sm">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">{content.title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {content.description}
            </p>
            {content.details && content.details.length > 0 && (
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                {content.details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            )}
            {content.learnMoreUrl && (
              <a
                href={content.learnMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                Learn more
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </ClientTooltipContent>
      </ClientTooltip>
    </ClientTooltipProvider>
  );
});
