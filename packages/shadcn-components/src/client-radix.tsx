"use client";

/**
 * @domain shared
 * @layer ui
 * @responsibility Pre-wrapped client-only versions of Radix UI components
 * @owner afenda/shadcn
 *
 * These components are wrapped with ClientOnly to prevent SSR hydration
 * mismatches caused by Radix UI's runtime-generated aria-controls IDs.
 *
 * Use these when you need a Radix component in a server-rendered page
 * and are experiencing hydration warnings like:
 *   "Prop `aria-controls` did not match. Server: radix-xxx Client: radix-yyy"
 *
 * @example
 * // Instead of:
 * import { Sheet, SheetTrigger, SheetContent } from "@afenda/shadcn";
 *
 * // Use:
 * import { ClientSheet, SheetTrigger, SheetContent } from "@afenda/shadcn";
 *
 * // The ClientSheet only renders on client, preventing hydration issues
 * <ClientSheet>
 *   <SheetTrigger>Open</SheetTrigger>
 *   <SheetContent>Content</SheetContent>
 * </ClientSheet>
 */

import * as React from "react";
import { ClientOnly } from "./client-only";

// Import the original components
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "./sheet";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "./dialog";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./tooltip";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
} from "./popover";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from "./dropdown-menu";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "./alert-dialog";

import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "./select";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "./tabs";

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "./collapsible";

// ============================================================================
// CLIENT-ONLY WRAPPER COMPONENTS
// ============================================================================

/**
 * Client-only Sheet - renders only on client to prevent aria-controls mismatch
 */
export function ClientSheet({
  children,
  fallback,
  ...props
}: React.ComponentProps<typeof Sheet> & { fallback?: React.ReactNode }) {
  return (
    <ClientOnly fallback={fallback}>
      <Sheet {...props}>{children}</Sheet>
    </ClientOnly>
  );
}

/**
 * Client-only Dialog - renders only on client to prevent aria-controls mismatch
 */
export function ClientDialog({
  children,
  fallback,
  ...props
}: React.ComponentProps<typeof Dialog> & { fallback?: React.ReactNode }) {
  return (
    <ClientOnly fallback={fallback}>
      <Dialog {...props}>{children}</Dialog>
    </ClientOnly>
  );
}

/**
 * Client-only Tooltip - renders only on client to prevent aria-controls mismatch
 */
export function ClientTooltip({
  children,
  fallback,
  ...props
}: React.ComponentProps<typeof Tooltip> & { fallback?: React.ReactNode }) {
  return (
    <ClientOnly fallback={fallback}>
      <Tooltip {...props}>{children}</Tooltip>
    </ClientOnly>
  );
}

/**
 * Client-only Popover - renders only on client to prevent aria-controls mismatch
 */
export function ClientPopover({
  children,
  fallback,
  ...props
}: React.ComponentProps<typeof Popover> & { fallback?: React.ReactNode }) {
  return (
    <ClientOnly fallback={fallback}>
      <Popover {...props}>{children}</Popover>
    </ClientOnly>
  );
}

/**
 * Client-only DropdownMenu - renders only on client to prevent aria-controls mismatch
 */
export function ClientDropdownMenu({
  children,
  fallback,
  ...props
}: React.ComponentProps<typeof DropdownMenu> & { fallback?: React.ReactNode }) {
  return (
    <ClientOnly fallback={fallback}>
      <DropdownMenu {...props}>{children}</DropdownMenu>
    </ClientOnly>
  );
}

/**
 * Client-only AlertDialog - renders only on client to prevent aria-controls mismatch
 */
export function ClientAlertDialog({
  children,
  fallback,
  ...props
}: React.ComponentProps<typeof AlertDialog> & { fallback?: React.ReactNode }) {
  return (
    <ClientOnly fallback={fallback}>
      <AlertDialog {...props}>{children}</AlertDialog>
    </ClientOnly>
  );
}

/**
 * Client-only Select - renders only on client to prevent aria-controls mismatch
 */
export function ClientSelect({
  children,
  fallback,
  ...props
}: React.ComponentProps<typeof Select> & { fallback?: React.ReactNode }) {
  return (
    <ClientOnly fallback={fallback}>
      <Select {...props}>{children}</Select>
    </ClientOnly>
  );
}

/**
 * Client-only Tabs - renders only on client to prevent aria-controls mismatch
 */
export function ClientTabs({
  children,
  fallback,
  ...props
}: React.ComponentProps<typeof Tabs> & { fallback?: React.ReactNode }) {
  return (
    <ClientOnly fallback={fallback}>
      <Tabs {...props}>{children}</Tabs>
    </ClientOnly>
  );
}

/**
 * Client-only Collapsible - renders only on client to prevent aria-controls mismatch
 */
export function ClientCollapsible({
  children,
  fallback,
  ...props
}: React.ComponentProps<typeof Collapsible> & { fallback?: React.ReactNode }) {
  return (
    <ClientOnly fallback={fallback}>
      <Collapsible {...props}>{children}</Collapsible>
    </ClientOnly>
  );
}

// ============================================================================
// RE-EXPORT CHILD COMPONENTS FOR CONVENIENCE
// (These don't need client-only wrapping as they're always inside the parent)
// ============================================================================

export {
  // Sheet children
  SheetTrigger as ClientSheetTrigger,
  SheetContent as ClientSheetContent,
  SheetHeader as ClientSheetHeader,
  SheetFooter as ClientSheetFooter,
  SheetTitle as ClientSheetTitle,
  SheetDescription as ClientSheetDescription,
  SheetClose as ClientSheetClose,
  // Dialog children
  DialogTrigger as ClientDialogTrigger,
  DialogContent as ClientDialogContent,
  DialogHeader as ClientDialogHeader,
  DialogFooter as ClientDialogFooter,
  DialogTitle as ClientDialogTitle,
  DialogDescription as ClientDialogDescription,
  DialogClose as ClientDialogClose,
  // Tooltip children
  TooltipTrigger as ClientTooltipTrigger,
  TooltipContent as ClientTooltipContent,
  TooltipProvider as ClientTooltipProvider,
  // Popover children
  PopoverTrigger as ClientPopoverTrigger,
  PopoverContent as ClientPopoverContent,
  PopoverAnchor as ClientPopoverAnchor,
  // DropdownMenu children
  DropdownMenuTrigger as ClientDropdownMenuTrigger,
  DropdownMenuContent as ClientDropdownMenuContent,
  DropdownMenuItem as ClientDropdownMenuItem,
  DropdownMenuCheckboxItem as ClientDropdownMenuCheckboxItem,
  DropdownMenuRadioItem as ClientDropdownMenuRadioItem,
  DropdownMenuLabel as ClientDropdownMenuLabel,
  DropdownMenuSeparator as ClientDropdownMenuSeparator,
  DropdownMenuShortcut as ClientDropdownMenuShortcut,
  DropdownMenuGroup as ClientDropdownMenuGroup,
  DropdownMenuPortal as ClientDropdownMenuPortal,
  DropdownMenuSub as ClientDropdownMenuSub,
  DropdownMenuSubContent as ClientDropdownMenuSubContent,
  DropdownMenuSubTrigger as ClientDropdownMenuSubTrigger,
  DropdownMenuRadioGroup as ClientDropdownMenuRadioGroup,
  // AlertDialog children
  AlertDialogTrigger as ClientAlertDialogTrigger,
  AlertDialogContent as ClientAlertDialogContent,
  AlertDialogHeader as ClientAlertDialogHeader,
  AlertDialogFooter as ClientAlertDialogFooter,
  AlertDialogTitle as ClientAlertDialogTitle,
  AlertDialogDescription as ClientAlertDialogDescription,
  AlertDialogAction as ClientAlertDialogAction,
  AlertDialogCancel as ClientAlertDialogCancel,
  // Select children
  SelectGroup as ClientSelectGroup,
  SelectValue as ClientSelectValue,
  SelectTrigger as ClientSelectTrigger,
  SelectContent as ClientSelectContent,
  SelectLabel as ClientSelectLabel,
  SelectItem as ClientSelectItem,
  SelectSeparator as ClientSelectSeparator,
  SelectScrollUpButton as ClientSelectScrollUpButton,
  SelectScrollDownButton as ClientSelectScrollDownButton,
  // Tabs children
  TabsList as ClientTabsList,
  TabsTrigger as ClientTabsTrigger,
  TabsContent as ClientTabsContent,
  // Collapsible children
  CollapsibleTrigger as ClientCollapsibleTrigger,
  CollapsibleContent as ClientCollapsibleContent,
};
