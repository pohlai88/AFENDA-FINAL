"use client";

/**
 * Helper Panel Component
 * Displays contextual help content based on current route.
 */

import * as React from "react";
import Link from "next/link";
import { IconBulb, IconRocket, IconBook } from "@tabler/icons-react";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  Button,
  Badge,
  Separator,
  ScrollArea,
} from "@afenda/shadcn";

import type { HelperContent } from "./helper-content-map";

export interface HelperPanelProps {
  isOpen: boolean;
  onClose: () => void;
  content: HelperContent;
  onStartOnboarding?: () => void;
}

export const HelperPanel = React.memo<HelperPanelProps>(function HelperPanel({
  isOpen,
  onClose,
  content,
  onStartOnboarding,
}) {
  // Memoize panel content to prevent recreation on every render
  const panelContent = React.useMemo(() => (
    <div className="space-y-6">
      {/* Quick Tips */}
      {content.quickTips.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <IconBulb className="size-5 text-chart-3" />
            <h3 className="font-semibold">Quick Tips</h3>
          </div>
          <ul className="space-y-2">
            {content.quickTips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Badge variant="outline" className="mt-0.5 shrink-0">
                  {index + 1}
                </Badge>
                <span className="text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Common Tasks */}
      {content.commonTasks.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <IconRocket className="size-5 text-chart-1" />
              <h3 className="font-semibold">Common Tasks</h3>
            </div>
            <div className="space-y-2">
              {content.commonTasks.map((task, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    task.action();
                    onClose();
                  }}
                >
                  {task.label}
                </Button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Related Documentation */}
      {content.relatedDocs.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <IconBook className="size-5 text-chart-2" />
              <h3 className="font-semibold">Related Documentation</h3>
            </div>
            <div className="space-y-2">
              {content.relatedDocs.map((doc, index) => (
                <Button
                  key={index}
                  variant="link"
                  size="sm"
                  className="w-full justify-start p-0 h-auto"
                  asChild
                >
                  <Link href={doc.href}>{doc.label}</Link>
                </Button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Start Onboarding Tour */}
      {onStartOnboarding && (
        <>
          <Separator />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              onStartOnboarding();
              onClose();
            }}
          >
            Start Onboarding Tour
          </Button>
        </>
      )}
    </div>
  ), [content, onStartOnboarding, onClose]);

  // Use Drawer with direction support (bottom for mobile, right for desktop)
  return (
    <>
      {/* Mobile: Bottom drawer */}
      <Drawer open={isOpen} onOpenChange={onClose} direction="bottom">
        <DrawerContent className="sm:hidden max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>{content.title}</DrawerTitle>
            <DrawerDescription>{content.description}</DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="px-4 pb-4 max-h-[calc(85vh-6rem)]">
            {panelContent}
          </ScrollArea>
        </DrawerContent>
      </Drawer>

      {/* Desktop: Right drawer */}
      <Drawer open={isOpen} onOpenChange={onClose} direction="right">
        <DrawerContent className="hidden sm:flex max-h-screen">
          <DrawerHeader>
            <DrawerTitle>{content.title}</DrawerTitle>
            <DrawerDescription>{content.description}</DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="px-4 pb-4 flex-1">
            {panelContent}
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    </>
  );
});

HelperPanel.displayName = "HelperPanel";
