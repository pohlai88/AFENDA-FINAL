/**
 * Shared Bulk Actions UI Components
 * Pure presentational components (props in, events out)
 */

"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
} from "@afenda/shadcn";
import { cn } from "@afenda/shadcn/lib/utils";

import type { BulkAction, BulkActionToolbarProps, BulkActionConfirmationProps } from "./types";

/**
 * Bulk action confirmation dialog
 */
function BulkActionConfirmation<T = unknown>({
  open,
  onOpenChange,
  action,
  itemCount,
  onConfirm,
}: BulkActionConfirmationProps<T>) {
  if (!action) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Confirm Bulk Action
          </AlertDialogTitle>
          <AlertDialogDescription>
            {action.confirmationMessage || (
              <>
                Are you sure you want to <strong>{action.label.toLowerCase()}</strong>{" "}
                <strong>{itemCount}</strong> item{itemCount !== 1 ? "s" : ""}?
                <br />
                This action cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(
              action.variant === "destructive" && "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
          >
            {action.label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Bulk action toolbar component
 */
export function BulkActionToolbar<T = unknown>({
  selectedItems,
  actions,
  onActionComplete,
  onActionError,
  disabled = false,
}: BulkActionToolbarProps<T>) {
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<BulkAction<T> | null>(null);

  const selectedCount = selectedItems.length;
  const hasSelection = selectedCount > 0;

  const visibleActions = React.useMemo(
    () => actions.filter((action) => !action.isHidden?.(selectedItems)),
    [actions, selectedItems]
  );

  const handleActionClick = async (action: BulkAction<T>) => {
    if (action.requiresConfirmation) {
      setConfirmAction(action);
      return;
    }

    await executeAction(action);
  };

  const executeAction = async (action: BulkAction<T>) => {
    setIsExecuting(true);
    try {
      await action.execute(selectedItems);
      onActionComplete?.();
    } catch (error) {
      onActionError?.(error);
    } finally {
      setIsExecuting(false);
      setConfirmAction(null);
    }
  };

  if (!hasSelection) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg border">
        <Badge variant="secondary" className="font-mono">
          {selectedCount} selected
        </Badge>

        {visibleActions.length > 0 && (
          <>
            {visibleActions.length <= 3 ? (
              // Show as buttons if 3 or fewer actions
              visibleActions.map((action) => {
                const Icon = action.icon;
                const isDisabled = disabled || isExecuting || action.isDisabled?.(selectedItems);

                return (
                  <Button
                    key={action.id}
                    variant={action.variant || "outline"}
                    size="sm"
                    onClick={() => handleActionClick(action)}
                    disabled={isDisabled}
                    className="gap-2"
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {action.label}
                  </Button>
                );
              })
            ) : (
              // Show as dropdown if more than 3 actions
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={disabled || isExecuting}>
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {visibleActions.map((action, index) => {
                    const Icon = action.icon;
                    const isDisabled = action.isDisabled?.(selectedItems);

                    return (
                      <React.Fragment key={action.id}>
                        {index > 0 && action.variant === "destructive" && (
                          <DropdownMenuSeparator />
                        )}
                        <DropdownMenuItem
                          onClick={() => handleActionClick(action)}
                          disabled={isDisabled}
                          className={cn(
                            action.variant === "destructive" && "text-destructive focus:text-destructive"
                          )}
                        >
                          {Icon && <Icon className="h-4 w-4 mr-2" />}
                          <div className="flex-1">
                            <div>{action.label}</div>
                            {action.description && (
                              <div className="text-xs text-muted-foreground">
                                {action.description}
                              </div>
                            )}
                          </div>
                        </DropdownMenuItem>
                      </React.Fragment>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        )}
      </div>

      {/* Confirmation dialog */}
      <BulkActionConfirmation<T>
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        action={confirmAction}
        itemCount={selectedCount}
        onConfirm={() => confirmAction && executeAction(confirmAction)}
      />
    </>
  );
}
