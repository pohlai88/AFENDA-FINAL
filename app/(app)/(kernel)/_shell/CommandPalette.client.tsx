"use client";

/**
 * Enterprise Command Palette (⌘K)
 * Production-ready command palette following shadcn best practices.
 *
 * - Fuzzy search globally across label, description, service, keywords
 * - Single source of truth: navigation.config + navTree
 * - Typed constants: COMMAND_PALETTE_RECENT_KEY
 * - useLocalStorage for persistence
 * - WCAG 2.1 AA: proper ARIA, keyboard nav, focus management
 *
 * @domain app
 * @layer ui/shell
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { IconSearch, IconClock } from "@tabler/icons-react";

import { routes, COMMAND_PALETTE_RECENT_KEY } from "@afenda/shared/constants";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  Badge,
  useLocalStorage,
} from "@afenda/shadcn";

import { getAllNavItems, ICON_MAP, type NavItemConfig } from "./navigation.config";
import type { NavTree } from "@afenda/orchestra";

export interface CommandPaletteClientProps {
  navTree: NavTree;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Command item with extended metadata for search and display */
interface CommandItemExt extends NavItemConfig {
  id: string;
  category: "quick" | "administration" | "navigation";
  service?: string;
  unavailable?: boolean;
  keywords?: string[];
}

/** Resolve icon component from config */
function getIcon(iconName?: string): React.ComponentType<{ className?: string }> {
  if (!iconName) return ICON_MAP.file ?? (() => null);
  const key = iconName.toLowerCase().replace(/[^a-z0-9]/g, "");
  return ICON_MAP[key as keyof typeof ICON_MAP] ?? ICON_MAP.file;
}

/** Build quick actions from routes */
function getQuickActions(): CommandItemExt[] {
  return [
    {
      id: "quick-dashboard",
      label: "Dashboard",
      href: routes.ui.orchestra.dashboard(),
      icon: "dashboard",
      description: "Main dashboard",
      category: "quick",
      keywords: ["dashboard", "home", "overview"],
    },
    {
      id: "quick-settings",
      label: "User Settings",
      href: routes.ui.orchestra.settings(),
      icon: "settings",
      description: "Profile and preferences",
      category: "quick",
      keywords: ["settings", "profile", "preferences"],
    },
  ];
}

/** Build admin items from navigation config + templates route */
function getAdminItems(): CommandItemExt[] {
  const navItems = getAllNavItems();
  const items: CommandItemExt[] = navItems.map((item) => ({
    ...item,
    id: item.id,
    category: "administration" as const,
    keywords: [item.label, item.description ?? ""].join(" ").toLowerCase().split(/\s+/).filter(Boolean),
  }));

  items.push({
    id: "admin-templates",
    label: "Configuration Templates",
    href: routes.ui.admin.configTemplates(),
    icon: "file",
    description: "Browse and apply templates",
    category: "administration",
    keywords: ["templates", "config", "patterns", "setup"],
  });

  return items;
}

/** Build nav items from navTree (dynamic services) */
function getNavItemsFromTree(navTree: NavTree): CommandItemExt[] {
  const items: CommandItemExt[] = [];

  for (const service of navTree.services) {
    const isDown = service.status === "down";
    for (const group of service.groups) {
      for (const item of group.items) {
        items.push({
          id: `${service.id}-${item.id}`,
          label: item.label,
          href: item.href,
          icon: item.icon ?? "file",
          description: `Navigate to ${item.label} in ${service.label}`,
          category: "navigation",
          service: service.label,
          unavailable: isDown,
          keywords: [item.label, service.label, item.id, service.id].join(" ").toLowerCase().split(/\s+/),
        });
      }
    }
  }

  return items;
}

/** Merge all items for lookup */
function getAllCommandItems(
  navTree: NavTree
): CommandItemExt[] {
  return [...getQuickActions(), ...getAdminItems(), ...getNavItemsFromTree(navTree)];
}

/**
 * Fuzzy search: matches characters in order (e.g. "bckup" → "Backup").
 * Returns score > 0 if match, 0 if no match. Higher score = better rank.
 */
function fuzzyMatchScore(target: string, query: string): number {
  const t = target.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return 1;
  let ti = 0;
  let qi = 0;
  let score = 0;
  let consecutiveBonus = 0;
  while (qi < q.length && ti < t.length) {
    const found = t.indexOf(q[qi], ti);
    if (found === -1) return 0;
    score += 1000 - found;
    if (found === ti) consecutiveBonus += 50;
    else if (found > 0 && t[found - 1] === " ") score += 20;
    ti = found + 1;
    qi++;
  }
  return qi === q.length ? score + consecutiveBonus : 0;
}

/** Run fuzzy search globally across all items */
function fuzzySearchItems(
  items: CommandItemExt[],
  query: string,
  opts?: { showUnavailable?: boolean }
): CommandItemExt[] {
  const q = query.trim();
  if (!q) return [];

  return items
    .filter((item) => {
      if (item.unavailable && !opts?.showUnavailable) return false;
      const text = [
        item.label,
        item.description ?? "",
        item.service ?? "",
        ...(item.keywords ?? []),
      ].join(" ");
      return fuzzyMatchScore(text, q) > 0;
    })
    .map((item) => {
      const text = [
        item.label,
        item.description ?? "",
        item.service ?? "",
        ...(item.keywords ?? []),
      ].join(" ");
      const score = fuzzyMatchScore(text, query);
      return { item, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);
}

export function CommandPaletteClient({
  navTree,
  open,
  onOpenChange,
}: CommandPaletteClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [recentIds, setRecentIds] = useLocalStorage<string[]>(
    COMMAND_PALETTE_RECENT_KEY,
    []
  );

  const allItems = React.useMemo(
    () => getAllCommandItems(navTree),
    [navTree]
  );

  const recentItems = React.useMemo(
    () =>
      (recentIds ?? [])
        .map((id) => allItems.find((i) => i.id === id))
        .filter((i): i is CommandItemExt => Boolean(i)),
    [recentIds, allItems]
  );

  const filteredItems = React.useMemo(() => {
    return fuzzySearchItems(allItems, searchQuery, {
      showUnavailable: searchQuery.toLowerCase().includes("down") || searchQuery.toLowerCase().includes("unavailable"),
    });
  }, [searchQuery, allItems]);

  const saveRecent = React.useCallback((id: string) => {
    setRecentIds((prev) => {
      const next = [id, ...(prev ?? []).filter((x) => x !== id)].slice(0, 10);
      return next;
    });
  }, [setRecentIds]);

  const handleSelect = React.useCallback(
    (item: CommandItemExt) => {
      if (item.unavailable) return;
      onOpenChange(false);
      router.push(item.href);
      saveRecent(item.id);
      setSearchQuery("");
    },
    [onOpenChange, router, saveRecent]
  );

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!next) setSearchQuery("");
      onOpenChange(next);
    },
    [onOpenChange]
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Command Palette"
      description="Search for pages, actions, and navigation. Press ⌘K to open."
    >
      <CommandInput
        placeholder="Type a command or search..."
        value={searchQuery}
        onValueChange={setSearchQuery}
        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        aria-label="Search commands and navigation"
      />

      <CommandList className="max-h-[min(400px,60vh)]">
        {!searchQuery ? (
          <>
            {recentItems.length > 0 && (
              <>
                <CommandGroup heading="Recent">
                  {recentItems.map((item) => {
                    const Icon = getIcon(item.icon);
                    return (
                      <CommandItem
                        key={`recent-${item.id}`}
                        value={`recent-${item.id} ${item.label}`}
                        keywords={item.keywords}
                        onSelect={() => handleSelect(item)}
                      >
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                        <IconClock className="ml-auto size-3.5 opacity-50" aria-hidden />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            <CommandGroup heading="Quick Actions">
              {getQuickActions().map((item) => {
                const Icon = getIcon(item.icon);
                return (
                  <CommandItem
                    key={item.id}
                    value={`${item.id} ${item.label}`}
                    keywords={item.keywords}
                    onSelect={() => handleSelect(item)}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                    <CommandShortcut>⌘K</CommandShortcut>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Administration">
              {getAdminItems().map((item) => {
                const Icon = getIcon(item.icon);
                return (
                  <CommandItem
                    key={item.id}
                    value={`${item.id} ${item.label} ${item.description ?? ""}`}
                    keywords={item.keywords}
                    onSelect={() => handleSelect(item)}
                  >
                    <Icon className="size-4" />
                    <div className="flex flex-col gap-0.5">
                      <span>{item.label}</span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        ) : filteredItems.length === 0 ? (
          <CommandEmpty>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <IconSearch className="mb-2 size-8 text-muted-foreground/50" aria-hidden />
              <p className="text-sm text-muted-foreground">
                No results for &quot;{searchQuery}&quot;
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try pages, actions, or navigation
              </p>
            </div>
          </CommandEmpty>
        ) : (
          <>
            {filteredItems.some((i) => i.category === "quick") && (
              <CommandGroup heading="Quick Actions">
                {filteredItems
                  .filter((i) => i.category === "quick")
                  .map((item) => {
                    const Icon = getIcon(item.icon);
                    return (
                      <CommandItem
                        key={item.id}
                        value={`${item.id} ${item.label} ${item.description ?? ""}`}
                        keywords={item.keywords}
                        onSelect={() => handleSelect(item)}
                      >
                        <Icon className="size-4" />
                        <div className="flex flex-col gap-0.5">
                          <span>{item.label}</span>
                          {item.description && (
                            <span className="text-xs text-muted-foreground">
                              {item.description}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
              </CommandGroup>
            )}

            {filteredItems.some((i) => i.category === "navigation") && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Navigation">
                  {filteredItems
                    .filter((i) => i.category === "navigation")
                    .map((item) => {
                      const Icon = getIcon(item.icon);
                      return (
                        <CommandItem
                          key={item.id}
                          value={`${item.id} ${item.label} ${item.service ?? ""}`}
                          keywords={item.keywords}
                          disabled={item.unavailable}
                          onSelect={() => handleSelect(item)}
                        >
                          <Icon className="size-4" />
                          <div className="flex flex-1 flex-col gap-0.5">
                            <span>{item.label}</span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {item.service && <span>{item.service}</span>}
                              {item.unavailable && <span>Service Down</span>}
                            </div>
                          </div>
                          {item.unavailable && (
                            <Badge variant="destructive" className="text-xs">
                              Down
                            </Badge>
                          )}
                        </CommandItem>
                      );
                    })}
                </CommandGroup>
              </>
            )}

            {filteredItems.some((i) => i.category === "administration") && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Administration">
                  {filteredItems
                    .filter((i) => i.category === "administration")
                    .map((item) => {
                      const Icon = getIcon(item.icon);
                      return (
                        <CommandItem
                          key={item.id}
                          value={`${item.id} ${item.label} ${item.description ?? ""}`}
                          keywords={item.keywords}
                          onSelect={() => handleSelect(item)}
                        >
                          <Icon className="size-4" />
                          <div className="flex flex-col gap-0.5">
                            <span>{item.label}</span>
                            {item.description && (
                              <span className="text-xs text-muted-foreground">
                                {item.description}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      );
                    })}
                </CommandGroup>
              </>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

const CommandPaletteContext = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
} | null>(null);

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  const ctx = React.useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error("useCommandPalette must be used within CommandPaletteProvider");
  }
  return ctx;
}
