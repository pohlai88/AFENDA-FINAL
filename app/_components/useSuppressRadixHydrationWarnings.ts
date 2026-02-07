"use client";

/**
 * Radix UI hydration – best practice
 *
 * Radix components (Dialog, Select, DropdownMenu, Sheet, Popover, Tooltip, AlertDialog)
 * generate runtime IDs for aria-controls/aria-labelledby that can differ between
 * server and client, causing React hydration mismatches.
 *
 * Recommended approach: use the client-only wrappers from @afenda/shadcn so Radix
 * only runs on the client and no server/client ID mismatch occurs.
 *
 * Import from @afenda/shadcn:
 *   - ClientDialog, ClientDialogTrigger, ClientDialogContent, ...
 *   - ClientSelect, ClientSelectTrigger, ClientSelectContent, ClientSelectItem, ClientSelectValue
 *   - ClientDropdownMenu, ClientSheet, ClientPopover, ClientTooltip, ClientAlertDialog
 *
 * Use these in any component that is server-rendered or that hydrates (e.g. pages
 * and client components that use Radix). Example: replace <Dialog> with <ClientDialog>
 * and DialogTrigger with ClientDialogTrigger, etc.
 *
 * See: packages/shadcn-components/src/client-radix.tsx and client-only.tsx
 */

/** @deprecated Use ClientDialog, ClientSelect, etc. from @afenda/shadcn instead. No-op for backwards compatibility. */
export function SuppressHydrationWarnings() {
  return null;
}

/** @deprecated Use Client* components from @afenda/shadcn instead. No-op for backwards compatibility. */
export function useSuppressRadixHydrationWarnings() {
  // No-op; Client* components are the correct fix
}
