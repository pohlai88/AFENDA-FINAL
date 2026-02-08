"use client";

/**
 * Spotlight overlay for in-actual tour steps.
 * Dims the page and highlights the real DOM element; tooltip asks user to click / type / submit there.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { IconX, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { Button } from "@afenda/shadcn";

/** Z-index layers for stacking (avoids Tailwind arbitrary-value linter warnings). */
const Z = {
  backdrop: 9997,
  root: 9998,
  spotlight: 9998,
  tooltip: 10000,
  card: 100,
} as const;

export interface SpotlightOverlayProps {
  /** CSS selector for target element. Ignored when getTarget is provided. */
  targetSelector?: string;
  /** Alternative to targetSelector: function that returns the element. Supports dynamic DOM. */
  getTarget?: () => Element | null;
  title: string;
  description: string;
  actionHint?: "click" | "type" | "submit";
  /** 1-based current step index. Shown as "Step X of Y" when both present. */
  currentStepIndex?: number;
  totalSteps?: number;
  /** Behavior when user clicks the dimmed overlay area. Default "close". */
  overlayClickBehavior?: "close" | "nextStep";
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  canGoBack: boolean;
}

const ACTION_HINT_TEXT: Record<"click" | "type" | "submit", string> = {
  click: "Click here to continue",
  type: "Enter the value here, then continue",
  submit: "Submit the form, then continue",
};

export const SpotlightOverlay = React.memo<SpotlightOverlayProps>(function SpotlightOverlay({
  targetSelector,
  getTarget,
  title,
  description,
  actionHint,
  currentStepIndex,
  totalSteps,
  overlayClickBehavior = "close",
  onNext,
  onBack,
  onSkip,
  canGoBack,
}) {
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const [tooltipPlacement, setTooltipPlacement] = React.useState<"below" | "above">("below");
  const rafIdRef = React.useRef<number | null>(null);
  const resizeObserverRef = React.useRef<ResizeObserver | null>(null);
  const mutationObserverRef = React.useRef<MutationObserver | null>(null);

  const updateRect = React.useCallback(() => {
    if (typeof document === "undefined") return;
    const el = getTarget ? getTarget() : targetSelector ? document.querySelector(targetSelector) : null;
    if (!el) {
      let dummy = document.getElementById("magic-tour-dummy");
      if (!dummy) {
        dummy = document.createElement("div");
        dummy.id = "magic-tour-dummy";
        dummy.style.cssText =
          "position:fixed;top:50%;left:50%;width:0;height:0;pointer-events:none;opacity:0";
        document.body.appendChild(dummy);
      }
      const r = dummy.getBoundingClientRect();
      setRect(r);
      setTooltipPlacement("below");
      return;
    }
    const r = el.getBoundingClientRect();
    setRect(r);
    setTooltipPlacement(r.bottom + 200 > window.innerHeight ? "above" : "below");
  }, [targetSelector, getTarget]);

  const scheduleUpdate = React.useCallback(() => {
    if (rafIdRef.current !== null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      updateRect();
    });
  }, [updateRect]);

  React.useEffect(() => {
    updateRect();
    
    // Use ResizeObserver for better performance than interval polling
    const el = getTarget ? getTarget() : targetSelector ? document.querySelector(targetSelector) : null;
    if (el && typeof ResizeObserver !== "undefined") {
      resizeObserverRef.current = new ResizeObserver(scheduleUpdate);
      resizeObserverRef.current.observe(el);
      
      // Also observe for attribute changes that might affect size
      if (typeof MutationObserver !== "undefined") {
        mutationObserverRef.current = new MutationObserver(scheduleUpdate);
        mutationObserverRef.current.observe(el, { attributes: true, attributeFilter: ["class", "style"] });
      }
    }
    
    window.addEventListener("scroll", scheduleUpdate, true);
    window.addEventListener("resize", scheduleUpdate);
    
    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
      if (mutationObserverRef.current) mutationObserverRef.current.disconnect();
      window.removeEventListener("scroll", scheduleUpdate, true);
      window.removeEventListener("resize", scheduleUpdate);
      const dummy = document.getElementById("magic-tour-dummy");
      if (dummy) dummy.remove();
    };
  }, [updateRect, scheduleUpdate, targetSelector, getTarget]);

  const handleBackdropClick = React.useCallback(() => {
    if (overlayClickBehavior === "nextStep") onNext();
    else onSkip();
  }, [overlayClickBehavior, onNext, onSkip]);

  if (typeof document === "undefined") return null;

  // Memoize tooltip content to prevent unnecessary re-renders
  // eslint-disable-next-line react-hooks/rules-of-hooks -- conditional rendering after early return guard
  const tooltipContent = React.useMemo(
    () => (
      <div
        className="space-y-4 p-4 bg-background border border-border rounded-lg shadow-xl max-w-[320px]"
        style={{ zIndex: Z.card }}
      >
        {currentStepIndex != null && totalSteps != null && (
          <p className="text-xs text-muted-foreground mb-1">
            Step {currentStepIndex} of {totalSteps}
          </p>
        )}
        <h4 className="font-semibold text-sm">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
        {actionHint && (
          <p className="text-xs font-medium text-primary">
            {ACTION_HINT_TEXT[actionHint]}
          </p>
        )}
        <div className="flex items-center justify-between gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onSkip} aria-label="Skip tour">
            <IconX className="mr-2 size-4" />
            Skip
          </Button>
          <div className="flex gap-2">
            {canGoBack && (
              <Button variant="outline" size="sm" onClick={onBack} aria-label="Back">
                <IconChevronLeft className="mr-2 size-4" />
                Back
              </Button>
            )}
            <Button size="sm" onClick={onNext} aria-label="Next">
              Next
              <IconChevronRight className="ml-2 size-4" />
            </Button>
          </div>
        </div>
      </div>
    ),
    [title, description, actionHint, currentStepIndex, totalSteps, canGoBack, onNext, onBack, onSkip]
  );

  const overlay = (
    <div
      className="fixed inset-0"
      style={{ zIndex: Z.root }}
      role="dialog"
      aria-modal="true"
      aria-label="Tour spotlight"
    >
      {rect ? (
        <>
          {/* Clickable backdrop: four bars (top, left, right, bottom) form dim with hole for target */}
          <div
            className="fixed left-0 right-0 top-0 bg-black/50 cursor-pointer"
            style={{ height: rect.top, zIndex: Z.backdrop }}
            onClick={handleBackdropClick}
            aria-hidden
          />
          <div
            className="fixed left-0 bg-black/50 cursor-pointer"
            style={{ top: rect.top, width: rect.left, height: rect.height, zIndex: Z.backdrop }}
            onClick={handleBackdropClick}
            aria-hidden
          />
          <div
            className="fixed right-0 bg-black/50 cursor-pointer"
            style={{ top: rect.top, left: rect.right, height: rect.height, zIndex: Z.backdrop }}
            onClick={handleBackdropClick}
            aria-hidden
          />
          <div
            className="fixed left-0 right-0 bottom-0 bg-black/50 cursor-pointer"
            style={{ top: rect.bottom, zIndex: Z.backdrop }}
            onClick={handleBackdropClick}
            aria-hidden
          />
          <div
            className="fixed rounded-md ring-2 ring-primary ring-offset-2 ring-offset-transparent bg-transparent pointer-events-none transition-[left,top,width,height] duration-150"
            style={{
              left: rect.left - 4,
              top: rect.top - 4,
              width: rect.width + 8,
              height: rect.height + 8,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
              zIndex: Z.spotlight,
              willChange: "left, top, width, height",
            }}
            aria-hidden
          />
          <div
            className="fixed transition-all duration-150 pointer-events-auto"
            style={{
              zIndex: Z.tooltip,
              left: Math.max(16, Math.min(rect.left, typeof window !== "undefined" ? window.innerWidth - 336 : 0)),
              top: tooltipPlacement === "below" ? rect.bottom + 12 : rect.top - 12 - 200,
              willChange: "left, top",
            }}
          >
            {tooltipContent}
          </div>
        </>
      ) : (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 bg-black/40 cursor-pointer"
          style={{ zIndex: Z.backdrop }}
          onClick={handleBackdropClick}
        >
          <div
            className="bg-background border rounded-lg shadow-xl p-4 max-w-sm cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-muted-foreground mb-2">
              Target element not found. Add <code className="text-xs bg-muted px-1 rounded">data-magic-tour=&quot;...&quot;</code> to the element, or continue.
            </p>
            {tooltipContent}
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(overlay, document.body);
});

SpotlightOverlay.displayName = "SpotlightOverlay";
