/**
 * @domain magictodo
 * @layer ui
 * @responsibility Multi-assignee picker with role selection
 */

"use client"

import { useState, useCallback } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@afenda/shadcn"
import {
  ClientPopover,
  ClientPopoverContent,
  ClientPopoverTrigger,
} from "@afenda/shadcn"
import {
  ClientSelect,
  ClientSelectContent,
  ClientSelectItem,
  ClientSelectTrigger,
  ClientSelectValue,
} from "@afenda/shadcn"
import { Button } from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import { Avatar, AvatarFallback, AvatarImage } from "@afenda/shadcn"
import { Skeleton } from "@afenda/shadcn"
import {
  UserPlus,
  X,
  Users,
  Eye,
  ClipboardCheck,
} from "lucide-react"
import { cn } from "@afenda/shared/utils"
import { toast } from "sonner"
import type {
  TaskAssigneeResponse,
  TaskAssigneeListResponse,
  AddTaskAssigneeRequest,
  AssigneeRole,
} from "@afenda/magictodo/zod"
import { ASSIGNEE_ROLE } from "@afenda/magictodo/zod"

// ============ Types ============
export interface AssigneeSelectorProps {
  taskId: string
  disabled?: boolean
  className?: string
}

interface TeamMember {
  userId: string
  displayName: string | null
  email: string | null
  avatar: string | null
}

// ============ Role Configuration ============
const ROLE_CONFIG: Record<string, { label: string; icon: typeof Users; color: string }> = {
  [ASSIGNEE_ROLE.ASSIGNEE]: { label: "Assignee", icon: Users, color: "bg-blue-500" },
  [ASSIGNEE_ROLE.REVIEWER]: { label: "Reviewer", icon: ClipboardCheck, color: "bg-purple-500" },
  [ASSIGNEE_ROLE.OBSERVER]: { label: "Observer", icon: Eye, color: "bg-gray-500" },
}

// ============ API Functions ============
async function fetchAssignees(taskId: string): Promise<TaskAssigneeListResponse> {
  // eslint-disable-next-line no-restricted-syntax -- route constant not yet defined
  const res = await fetch(`/api/v1/tasks/${taskId}/assignees`)
  if (!res.ok) throw new Error("Failed to fetch assignees")
  return res.json()
}

async function addAssignee(taskId: string, data: AddTaskAssigneeRequest): Promise<TaskAssigneeResponse> {
  // eslint-disable-next-line no-restricted-syntax -- route constant not yet defined
  const res = await fetch(`/api/v1/tasks/${taskId}/assignees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message || "Failed to add assignee")
  }
  return res.json()
}

async function removeAssignee(taskId: string, userId: string): Promise<void> {
  // eslint-disable-next-line no-restricted-syntax -- route constant not yet defined
  const res = await fetch(`/api/v1/tasks/${taskId}/assignees/${userId}`, {
    method: "DELETE",
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message || "Failed to remove assignee")
  }
}

async function fetchTeamMembers(): Promise<TeamMember[]> {
  // TODO: Replace with actual team members API when available
  // For now, fetch from user profiles or return empty
  try {
    // eslint-disable-next-line no-restricted-syntax -- route constant not yet defined
    const res = await fetch("/api/v1/users/team-members")
    if (!res.ok) return []
    const data = await res.json()
    return data.items ?? []
  } catch {
    return []
  }
}

// ============ Assignee Badge ============
function AssigneeBadge({
  assignee,
  onRemove,
  disabled,
}: {
  assignee: TaskAssigneeResponse
  onRemove: () => void
  disabled?: boolean
}) {
  const initials = assignee.displayName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?"

  const roleConfig = ROLE_CONFIG[assignee.role] ?? ROLE_CONFIG.assignee

  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted group">
      <Avatar className="h-5 w-5">
        <AvatarImage src={assignee.avatar ?? undefined} />
        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
      </Avatar>
      <span className="text-xs font-medium truncate max-w-24">
        {assignee.displayName ?? assignee.email ?? "Unknown"}
      </span>
      <Badge variant="outline" className={cn("text-[10px] px-1 py-0", roleConfig.color, "text-white")}>
        {roleConfig.label}
      </Badge>
      {!disabled && (
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
        >
          <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
        </button>
      )}
    </div>
  )
}

// ============ Main Component ============
export function AssigneeSelector({ taskId, disabled, className }: AssigneeSelectorProps) {
  const [open, setOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<AssigneeRole>("assignee")
  const queryClient = useQueryClient()

  // Fetch current assignees
  const {
    data: assigneesData,
    isLoading: loadingAssignees,
  } = useQuery({
    queryKey: ["task-assignees", taskId],
    queryFn: () => fetchAssignees(taskId),
    enabled: !!taskId,
  })

  // Fetch team members for selection
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-members"],
    queryFn: fetchTeamMembers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Add assignee mutation
  const addMutation = useMutation({
    mutationFn: (data: AddTaskAssigneeRequest) => addAssignee(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-assignees", taskId] })
      toast.success("Assignee added")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Remove assignee mutation
  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeAssignee(taskId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-assignees", taskId] })
      toast.success("Assignee removed")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const assignees = assigneesData?.items ?? []
  const assignedUserIds = new Set(assignees.map((a) => a.userId))

  // Filter out already assigned members
  const availableMembers = teamMembers.filter((m) => !assignedUserIds.has(m.userId))

  const handleAddAssignee = useCallback(
    (userId: string) => {
      addMutation.mutate({ userId, role: selectedRole })
      setOpen(false)
    },
    [addMutation, selectedRole]
  )

  const handleRemoveAssignee = useCallback(
    (userId: string) => {
      removeMutation.mutate(userId)
    },
    [removeMutation]
  )

  if (loadingAssignees) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-7 w-20" />
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Current Assignees */}
      {assignees.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {assignees.map((assignee) => (
            <AssigneeBadge
              key={assignee.id}
              assignee={assignee}
              onRemove={() => handleRemoveAssignee(assignee.userId)}
              disabled={disabled || removeMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Add Assignee Button */}
      {!disabled && (
        <ClientPopover open={open} onOpenChange={setOpen}>
          <ClientPopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1"
              disabled={addMutation.isPending}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add Assignee
            </Button>
          </ClientPopoverTrigger>
          <ClientPopoverContent className="w-80 p-0" align="start">
            <div className="flex items-center gap-2 p-3 border-b">
              <span className="text-sm font-medium">Role:</span>
              <ClientSelect
                value={selectedRole}
                onValueChange={(v) => setSelectedRole(v as AssigneeRole)}
              >
                <ClientSelectTrigger className="h-8 w-32">
                  <ClientSelectValue />
                </ClientSelectTrigger>
                <ClientSelectContent>
                  <ClientSelectItem value="assignee">Assignee</ClientSelectItem>
                  <ClientSelectItem value="reviewer">Reviewer</ClientSelectItem>
                  <ClientSelectItem value="observer">Observer</ClientSelectItem>
                </ClientSelectContent>
              </ClientSelect>
            </div>
            <Command>
              <CommandInput placeholder="Search team members..." />
              <CommandList>
                <CommandEmpty>
                  {teamMembers.length === 0
                    ? "No team members available"
                    : "All members are already assigned"}
                </CommandEmpty>
                <CommandGroup>
                  {availableMembers.map((member) => {
                    const initials = member.displayName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) ?? "?"

                    return (
                      <CommandItem
                        key={member.userId}
                        value={member.displayName ?? member.email ?? member.userId}
                        onSelect={() => handleAddAssignee(member.userId)}
                      >
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={member.avatar ?? undefined} />
                          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {member.displayName ?? "Unknown"}
                          </span>
                          {member.email && (
                            <span className="text-xs text-muted-foreground">{member.email}</span>
                          )}
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </ClientPopoverContent>
        </ClientPopover>
      )}

      {/* Empty State */}
      {assignees.length === 0 && !disabled && (
        <p className="text-xs text-muted-foreground">No assignees yet</p>
      )}
    </div>
  )
}

export default AssigneeSelector
