/**
 * @domain magictodo
 * @layer ui
 * @responsibility Global command palette for MagicTodo with Cmd/Ctrl+K hotkey
 */

"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@afenda/shadcn"
import {
  CalendarDays,
  CheckCircle2,
  Focus,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  Plus,
  Search,
  Settings,
  Target,
} from "lucide-react"
import { routes } from "@afenda/shared/constants"

interface CommandPaletteProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CommandPalette({ open: controlledOpen, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  // Use controlled or uncontrolled state
  const isOpen = controlledOpen !== undefined ? controlledOpen : open
  const setIsOpen = onOpenChange ?? setOpen

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen(!isOpen)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, setIsOpen])

  const runCommand = useCallback((command: () => void) => {
    setIsOpen(false)
    command()
  }, [setIsOpen])

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem
            onSelect={() => runCommand(() => router.push(routes.ui.magictodo.tasks() + "?action=new"))}
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>New Task</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push(routes.ui.magictodo.focus()))}
          >
            <Target className="mr-2 h-4 w-4" />
            <span>Start Focus Session</span>
            <CommandShortcut>⌘F</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => {
              // Trigger search in current page
              const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]')
              searchInput?.focus()
            })}
          >
            <Search className="mr-2 h-4 w-4" />
            <span>Search Tasks</span>
            <CommandShortcut>/</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => runCommand(() => router.push(routes.ui.orchestra.dashboard()))}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push(routes.ui.magictodo.tasks()))}
          >
            <ListTodo className="mr-2 h-4 w-4" />
            <span>Tasks</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push(routes.ui.magictodo.projects()))}
          >
            <FolderKanban className="mr-2 h-4 w-4" />
            <span>Projects</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push(routes.ui.magictodo.focus()))}
          >
            <Focus className="mr-2 h-4 w-4" />
            <span>Focus Mode</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push(routes.ui.magictodo.kanban()))}
          >
            <FolderKanban className="mr-2 h-4 w-4" />
            <span>Kanban Board</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push(routes.ui.magictodo.calendar()))}
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            <span>Calendar</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Settings */}
        <CommandGroup heading="Settings">
          <CommandItem
            onSelect={() => runCommand(() => router.push(routes.ui.magictodo.settings()))}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <CommandShortcut>⌘,</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
