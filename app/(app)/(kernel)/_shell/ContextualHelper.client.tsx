"use client";

/**
 * Contextual Helper Component
 * Enterprise-grade FAB using shadcn DropdownMenu + Tooltip.
 * Apple-style floating action button with branching contextual actions.
 * Best practice: Radix handles a11y, focus, escape, click-outside; Tooltip for discoverability.
 */

import * as React from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import {
  IconHelp,
  IconMapPin,
  IconRoute,
  IconActivity,
  IconBulb,
  IconRocket,
  IconSparkles,
  IconX,
} from "@tabler/icons-react";

import {
  Button,
  Badge,
  ClientDropdownMenu,
  ClientDropdownMenuTrigger,
  ClientDropdownMenuContent,
  ClientDropdownMenuItem,
  ClientDropdownMenuSeparator,
  ClientDropdownMenuGroup,
  ClientDropdownMenuLabel,
  ClientTooltip,
  ClientTooltipTrigger,
  ClientTooltipContent,
} from "@afenda/shadcn";
import { routes } from "@afenda/shared/constants";
import { FAB_HINT_DISMISSED_KEY, MACHINA_OPEN_EVENT } from "@afenda/shared/constants";

import { HelperPanel } from "./HelperPanel.client";
import { getHelperContent } from "./helper-content-map";
import { useOnboarding } from "./OnboardingWizardProvider.client";
import { SOSWorkflowPanel } from "../dashboard/_components/SOSWorkflowPanel";
import { getWorkflowsForPathname } from "../dashboard/_components/workflowDefinitions";

// Lazy load Magic Tour with performance optimization
const MagicTourRunner = dynamic(
  () => {
    // Mark performance entry for monitoring
    if (typeof performance !== "undefined" && performance.mark) {
      performance.mark("magic-tour-load-start");
    }
    return import("./magic-tour").then((m) => {
      if (typeof performance !== "undefined" && performance.mark) {
        performance.mark("magic-tour-load-end");
        performance.measure("magic-tour-load", "magic-tour-load-start", "magic-tour-load-end");
      }
      return m.MagicTourRunner;
    });
  },
  { 
    ssr: false, 
    loading: () => null 
  }
);

interface BranchOption {
  id: string;
  label: string;
  /** Short explanation of what this option does (shown under label + used for tooltip) */
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  variant?: "default" | "secondary" | "destructive";
  badge?: string;
  ariaLabel?: string;
}

export function ContextualHelper() {
  const pathname = usePathname();
  const router = useRouter();
  const { startOnboarding } = useOnboarding();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isPulsing, setIsPulsing] = React.useState(true);
  const [showWorkflowPanel, setShowWorkflowPanel] = React.useState(false);
  const [showMagicTour, setShowMagicTour] = React.useState(false);
  const [showFirstTimeHint, setShowFirstTimeHint] = React.useState(false);

  // Prefetch magic tour module on hover for better perceived performance
  const prefetchMagicTour = React.useCallback(() => {
    if (typeof window === "undefined") return;
    import("./magic-tour").catch(() => {
      // Silently catch prefetch errors - module will load on click
    });
  }, []);

  // Get content for current route - memoize to prevent recreation
  const content = React.useMemo(() => getHelperContent(pathname), [pathname]);

  // SOS "Where am I?" – workflows contextualized to current path
  const { workflows: sosWorkflows, currentWorkflowId: sosCurrentWorkflowId } = React.useMemo(
    () => getWorkflowsForPathname(pathname),
    [pathname]
  );

  // Stop pulsing after 30 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => setIsPulsing(false), 30000);
    return () => clearTimeout(timer);
  }, []);

  // First-time hint: show "Press ? for help" once per session; dismiss on open or after 3s
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = window.sessionStorage.getItem(FAB_HINT_DISMISSED_KEY);
    if (!dismissed) setShowFirstTimeHint(true);
  }, []);
  React.useEffect(() => {
    if (!showFirstTimeHint) return;
    const dismiss = () => {
      setShowFirstTimeHint(false);
      try {
        window.sessionStorage.setItem(FAB_HINT_DISMISSED_KEY, "1");
      } catch {
        /* ignore */
      }
    };
    const onOpen = () => dismiss();
    const timer = setTimeout(dismiss, 3000);
    window.addEventListener("fab-hint-dismiss", onOpen);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("fab-hint-dismiss", onOpen);
    };
  }, [showFirstTimeHint]);
  React.useEffect(() => {
    if (isExpanded && showFirstTimeHint) {
      setShowFirstTimeHint(false);
      try {
        window.sessionStorage.setItem(FAB_HINT_DISMISSED_KEY, "1");
      } catch {
        /* ignore */
      }
    }
  }, [isExpanded, showFirstTimeHint]);

  // Keyboard shortcut: ? to open help - memoized to prevent recreation
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Only trigger if not typing in an input
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
          return;
        }
        e.preventDefault();
        setIsExpanded(prev => !prev);
      }
      if (e.key === "Escape") {
        setIsExpanded(false);
        setShowWorkflowPanel(false);
        setShowMagicTour(false);
      }
    };
    
    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, []); // Empty deps - handlers use setState with updater functions

  // Generate contextual branching options based on route and system state
  const branchOptions = React.useMemo<BranchOption[]>(() => {
    const options: BranchOption[] = [];

    // SOS Workflow – "Where am I?" (always first, primary)
    options.push({
      id: "where-am-i",
      label: "Where am I? (SOS)",
      description: "See your place in the current workflow and next steps",
      icon: IconMapPin,
      action: () => {
        setIsExpanded(false);
        setShowWorkflowPanel(prev => !prev);
      },
      variant: "default",
      ariaLabel: "Where am I? Open SOS workflow panel",
    });

    // Magic Tour – visualised step-by-step tour over same workflows
    options.push({
      id: "magic-tour",
      label: "Magic Tour",
      description: "Step-by-step walkthrough of workflows for this page",
      icon: IconRoute,
      action: () => {
        setIsExpanded(false);
        setShowMagicTour(true);
      },
      ariaLabel: "Start Magic Tour – step-by-step workflow walkthrough",
    });

    // Quick Tips from content
    if (content.quickTips.length > 0) {
      options.push({
        id: "quick-tips",
        label: "Quick Tips",
        description: "Short tips and hints for this page",
        icon: IconBulb,
        action: () => {
          setIsExpanded(false);
          setIsOpen(true);
        },
        badge: content.quickTips.length.toString(),
      });
    }

    // Common Tasks
    if (content.commonTasks.length > 0) {
      options.push({
        id: "common-tasks",
        label: "Common Tasks",
        description: "One-click actions for things you often do here",
        icon: IconRocket,
        action: () => {
          setIsExpanded(false);
          setIsOpen(true);
        },
        badge: content.commonTasks.length.toString(),
      });
    }

    // System Health (dashboard and admin areas)
    if (pathname.includes(routes.ui.orchestra.dashboard()) || pathname.startsWith(routes.ui.admin.root())) {
      options.push({
        id: "system-health",
        label: "System Health",
        description: "View system status and health checks",
        icon: IconActivity,
        action: () => {
          setIsExpanded(false);
          router.push(routes.ui.admin.health());
        },
      });
    }

    // Machina – the invisible machine revolution (suggested actions)
    options.push({
      id: "recommendations",
      label: "Machina",
      description: "Suggested actions from the invisible machine",
      icon: IconSparkles,
      action: () => {
        setIsExpanded(false);
        const onDashboard = pathname.includes(routes.ui.orchestra.dashboard());
        if (onDashboard) {
          window.dispatchEvent(new CustomEvent(MACHINA_OPEN_EVENT));
        } else {
          router.push(`${routes.ui.orchestra.dashboard()}?machina=1`);
          // After navigation, the dashboard will open the panel via ?machina=1
        }
      },
      ariaLabel: "Open Machina – suggested actions from the invisible machine",
    });

    // Onboarding
    options.push({
      id: "onboarding",
      label: "Take a Tour",
      description: "Guided tour of the app and key features",
      icon: IconHelp,
      action: () => {
        setIsExpanded(false);
        startOnboarding();
      },
      variant: "secondary",
    });

    return options;
  }, [pathname, content, router, startOnboarding]);

  // Listen for custom events
  React.useEffect(() => {
    const handleStartOnboarding = () => {
      startOnboarding();
      setIsOpen(false);
    };

    window.addEventListener("start-onboarding", handleStartOnboarding as EventListener);
    return () => window.removeEventListener("start-onboarding", handleStartOnboarding as EventListener);
  }, [startOnboarding]);

  // Group options for enterprise UX: Context (SOS + Magic Tour) first, then Quick actions, then Discover
  const primaryOptions = branchOptions.filter((o) =>
    ["where-am-i", "magic-tour"].includes(o.id)
  );
  const quickOptions = branchOptions.filter((o) =>
    ["quick-tips", "common-tasks", "system-health"].includes(o.id)
  );
  const discoverOptions = branchOptions.filter((o) =>
    ["recommendations", "onboarding"].includes(o.id)
  );

  return (
    <>
      {/* Backdrop: noise + dim + blur when FAB open — focuses attention on menu */}
      {isExpanded && (
        <div
          className="fab-backdrop"
          onClick={() => setIsExpanded(false)}
          onKeyDown={(e) => e.key === "Escape" && setIsExpanded(false)}
          role="button"
          tabIndex={-1}
          aria-label="Close help menu"
        >
          <div className="fab-backdrop-dim" />
          <svg
            className="fab-backdrop-noise"
            aria-hidden
            xmlns="http://www.w3.org/2000/svg"
          >
            <filter id="fab-noise-filter">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.7"
                numOctaves="3"
                result="noise"
              />
              <feColorMatrix in="noise" type="saturate" values="0" result="mono" />
            </filter>
            <rect width="100%" height="100%" filter="url(#fab-noise-filter)" />
          </svg>
          <p className="fab-backdrop-hint" aria-live="polite">
            Click outside or press Esc to close
          </p>
        </div>
      )}

      {/* Enterprise FAB: shadcn DropdownMenu (a11y, focus, escape) + Tooltip (discoverability) */}
      <div className="fab-container">
        {showFirstTimeHint && (
          <button
            type="button"
            className="fab-first-time-hint cursor-pointer border-0 bg-transparent text-left"
            onClick={() => {
              setShowFirstTimeHint(false);
              try {
                window.sessionStorage.setItem(FAB_HINT_DISMISSED_KEY, "1");
              } catch {
                /* ignore */
              }
            }}
            onKeyDown={(e) => e.key === "Escape" && (setShowFirstTimeHint(false), true)}
            aria-label="Dismiss hint: Press ? for help"
          >
            Press <kbd className="fab-hint-kbd">?</kbd> for help
          </button>
        )}
        <ClientDropdownMenu open={isExpanded} onOpenChange={setIsExpanded}>
          <ClientTooltip>
            <ClientTooltipTrigger asChild>
              <ClientDropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  data-magic-tour="help-fab"
                  className={`fab-button ${
                    isPulsing && !isExpanded ? "animate-pulse" : ""
                  } ${isExpanded ? "fab-button-expanded" : "fab-button-collapsed"}`}
                  aria-label={
                    isExpanded
                      ? "Close help menu"
                      : "Help and SOS workflow (Where am I?)"
                  }
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? (
                    <IconX className="size-6 transition-transform duration-200" />
                  ) : (
                    <IconHelp className="size-6 transition-transform duration-200" />
                  )}
                </Button>
              </ClientDropdownMenuTrigger>
            </ClientTooltipTrigger>
            <ClientTooltipContent side="left" sideOffset={12} className="font-medium">
              Help & quick actions{" "}
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                ?
              </kbd>
            </ClientTooltipContent>
          </ClientTooltip>

          <ClientDropdownMenuContent
            side="top"
            align="end"
            sideOffset={12}
            alignOffset={-8}
            collisionPadding={16}
            avoidCollisions={true}
            sticky="always"
            className="fab-dropdown-content min-w-[16rem] max-w-[20rem] rounded-xl py-2 shadow-xl"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            {primaryOptions.length > 0 && (
              <ClientDropdownMenuGroup>
                <ClientDropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5">
                  Context
                </ClientDropdownMenuLabel>
                {primaryOptions.map((option, i) => (
                  <ClientDropdownMenuItem
                    key={option.id}
                    style={{ "--fab-item-index": i } as React.CSSProperties}
                    title={option.description ?? option.label}
                    onSelect={(e) => {
                      e.preventDefault();
                      option.action();
                    }}
                    onMouseEnter={option.id === "magic-tour" ? prefetchMagicTour : undefined}
                    aria-label={option.ariaLabel ?? option.label}
                    aria-description={option.description}
                    variant={
                      option.variant === "destructive" ? "destructive" : undefined
                    }
                    className="fab-dropdown-item cursor-pointer gap-2 py-2"
                  >
                    <option.icon className="size-4 shrink-0 mt-0.5" />
                    <span className="flex-1 min-w-0">
                      <span className="block font-medium">{option.label}</span>
                      {option.description && (
                        <span className="fab-menu-item-description">
                          {option.description}
                        </span>
                      )}
                    </span>
                    {option.badge && (
                      <Badge
                        variant="secondary"
                        className="ml-auto text-xs px-1.5 font-normal shrink-0"
                      >
                        {option.badge}
                      </Badge>
                    )}
                  </ClientDropdownMenuItem>
                ))}
              </ClientDropdownMenuGroup>
            )}

            {quickOptions.length > 0 && (
              <>
                <ClientDropdownMenuSeparator />
                <ClientDropdownMenuGroup>
                  <ClientDropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5">
                    Quick actions
                  </ClientDropdownMenuLabel>
                  {quickOptions.map((option, i) => (
                    <ClientDropdownMenuItem
                      key={option.id}
                      style={
                        {
                          "--fab-item-index": primaryOptions.length + i,
                        } as React.CSSProperties
                      }
                      title={option.description ?? option.label}
                      onSelect={(e) => {
                        e.preventDefault();
                        option.action();
                      }}
                      aria-label={option.ariaLabel ?? option.label}
                      aria-description={option.description}
                      variant={
                        option.variant === "destructive" ? "destructive" : undefined
                      }
                      className="fab-dropdown-item cursor-pointer gap-2 py-2"
                    >
                      <option.icon className="size-4 shrink-0 mt-0.5" />
                      <span className="flex-1 min-w-0">
                        <span className="block font-medium">{option.label}</span>
                        {option.description && (
                          <span className="fab-menu-item-description">
                            {option.description}
                          </span>
                        )}
                      </span>
                      {option.badge && (
                        <Badge
                          variant="secondary"
                          className="ml-auto text-xs px-1.5 font-normal shrink-0"
                        >
                          {option.badge}
                        </Badge>
                      )}
                    </ClientDropdownMenuItem>
                  ))}
                </ClientDropdownMenuGroup>
              </>
            )}

            {discoverOptions.length > 0 && (
              <>
                <ClientDropdownMenuSeparator />
                <ClientDropdownMenuGroup>
                  <ClientDropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5">
                    Discover
                  </ClientDropdownMenuLabel>
                  {discoverOptions.map((option, i) => (
                    <ClientDropdownMenuItem
                      key={option.id}
                      style={
                        {
                          "--fab-item-index":
                            primaryOptions.length + quickOptions.length + i,
                        } as React.CSSProperties
                      }
                      title={option.description ?? option.label}
                      onSelect={(e) => {
                        e.preventDefault();
                        option.action();
                      }}
                      aria-label={option.ariaLabel ?? option.label}
                      aria-description={option.description}
                      variant={
                        option.variant === "destructive" ? "destructive" : undefined
                      }
                      className="fab-dropdown-item cursor-pointer gap-2 py-2"
                    >
                      <option.icon className="size-4 shrink-0 mt-0.5" />
                      <span className="flex-1 min-w-0">
                        <span className="block font-medium">{option.label}</span>
                        {option.description && (
                          <span className="fab-menu-item-description">
                            {option.description}
                          </span>
                        )}
                      </span>
                      {option.badge && (
                        <Badge
                          variant="secondary"
                          className="ml-auto text-xs px-1.5 font-normal shrink-0"
                        >
                          {option.badge}
                        </Badge>
                      )}
                    </ClientDropdownMenuItem>
                  ))}
                </ClientDropdownMenuGroup>
              </>
            )}
          </ClientDropdownMenuContent>
        </ClientDropdownMenu>
      </div>

      <HelperPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        content={content}
        onStartOnboarding={startOnboarding}
      />

      <SOSWorkflowPanel
        workflows={sosWorkflows}
        currentWorkflowId={sosCurrentWorkflowId ?? undefined}
        isOpen={showWorkflowPanel}
        onClose={() => setShowWorkflowPanel(false)}
      />

      {showMagicTour && (
        <React.Suspense 
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Loading tour...</p>
              </div>
            </div>
          }
        >
          <MagicTourRunner
            workflows={sosWorkflows}
            currentWorkflowId={sosCurrentWorkflowId}
            isOpen={showMagicTour}
            onClose={() => setShowMagicTour(false)}
          />
        </React.Suspense>
      )}
    </>
  );
}
