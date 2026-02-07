"use client";

/**
 * Role Multi-Select Dropdown
 * Professional shadcn Popover + Command multi-select for admin roles.
 * Syncs selection to hidden inputs for form submission.
 */

import * as React from "react";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  ClientPopover,
  ClientPopoverContent,
  ClientPopoverTrigger,
  Separator,
} from "@afenda/shadcn";
import { ADMIN_ROLES, ADMIN_ROLE_LABELS } from "../_constants/admin-assignment.constants";
import type { AdminRole } from "@afenda/orchestra";
import { cn } from "@afenda/shadcn/lib/utils";

interface RoleMultiSelectProps {
  selectedRoles: AdminRole[];
  onSelectionChange: (roles: AdminRole[]) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  /** Form field name for hidden inputs */
  name?: string;
  className?: string;
}

export function RoleMultiSelect({
  selectedRoles,
  onSelectionChange,
  placeholder = "Select roles",
  error,
  disabled,
  name = "roles",
  className,
}: RoleMultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const toggleRole = (role: AdminRole) => {
    const next = selectedRoles.includes(role)
      ? selectedRoles.filter((r) => r !== role)
      : [...selectedRoles, role];
    onSelectionChange(next);
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  return (
    <div className={cn("space-y-1", className)}>
      <ClientPopover open={open} onOpenChange={setOpen}>
        <ClientPopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-label="Select admin roles"
            disabled={disabled}
            className={cn(
              "h-8 w-full justify-between text-sm font-normal",
              !selectedRoles.length && "text-muted-foreground",
              error && "border-destructive"
            )}
          >
            <span className="truncate">
              {selectedRoles.length === 0
                ? placeholder
                : selectedRoles.length > 2
                  ? `${selectedRoles.length} roles selected`
                  : selectedRoles.map((r) => ADMIN_ROLE_LABELS[r]).join(", ")}
            </span>
            <IconChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </ClientPopoverTrigger>
        <ClientPopoverContent className="w-[240px] p-0" align="start">
          <Command>
            <CommandList>
              <CommandEmpty>No roles found.</CommandEmpty>
              <CommandGroup>
                {ADMIN_ROLES.map((role) => {
                  const isSelected = selectedRoles.includes(role);
                  return (
                    <CommandItem
                      key={role}
                      value={ADMIN_ROLE_LABELS[role]}
                      onSelect={() => toggleRole(role)}
                    >
                      <div
                        className={cn(
                          "mr-2 flex size-4 items-center justify-center rounded-sm border border-primary",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible"
                        )}
                      >
                        <IconCheck className="size-4" />
                      </div>
                      {ADMIN_ROLE_LABELS[role]}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {selectedRoles.length > 0 && (
                <>
                  <Separator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={clearSelection}
                      className="justify-center text-center text-muted-foreground"
                    >
                      Clear selection
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </ClientPopoverContent>
      </ClientPopover>
      {/* Hidden inputs for form submission */}
      {selectedRoles.map((role) => (
        <input key={role} type="hidden" name={name} value={role} readOnly />
      ))}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
