/**
 * @domain magictodo
 * @layer ui
 * @responsibility Push-to-Team modal for sharing tasks with teams/members
 */

"use client"

import { useState, useCallback } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ClientDialog,
  ClientDialogContent,
  ClientDialogDescription,
  ClientDialogFooter,
  ClientDialogHeader,
  ClientDialogTitle,
  ClientDialogTrigger,
} from "@afenda/shadcn"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@afenda/shadcn"
import {
  ClientSelect,
  ClientSelectContent,
  ClientSelectItem,
  ClientSelectTrigger,
  ClientSelectValue,
} from "@afenda/shadcn"
import { Button } from "@afenda/shadcn"
import { Label } from "@afenda/shadcn"
import { Textarea } from "@afenda/shadcn"
import { Switch } from "@afenda/shadcn"
import { Avatar, AvatarFallback, AvatarImage } from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import { Checkbox } from "@afenda/shadcn"
import { Skeleton } from "@afenda/shadcn"
import {
  Share2,
  Users,
  User,
  Copy,
  Link2,
  X,
  Check,
  Building2,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import type { AssigneeRole } from "@afenda/magictodo/zod"

// ============ Types ============
interface PushToTeamModalProps {
  taskId: string
  taskTitle: string
  /** Multiple task IDs for batch push */
  taskIds?: string[]
  trigger?: React.ReactNode
  onSuccess?: () => void
}

interface Team {
  id: string
  name: string
  memberCount: number
}

interface TeamMember {
  userId: string
  displayName: string | null
  email: string | null
  avatar: string | null
  teamId?: string
}

type ShareMode = "share" | "copy"
type RecipientType = "team" | "member"

// ============ API Functions ============
async function fetchTeams(): Promise<Team[]> {
  try {
    // eslint-disable-next-line no-restricted-syntax -- route constant not yet defined
    const res = await fetch("/api/v1/teams")
    if (!res.ok) return []
    const data = await res.json()
    return data.items ?? []
  } catch {
    return []
  }
}

async function fetchTeamMembers(teamId?: string): Promise<TeamMember[]> {
  try {
    // eslint-disable-next-line no-restricted-syntax -- route constant not yet defined
    const url = teamId ? `/api/v1/teams/${teamId}/members` : "/api/v1/users/team-members"
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    return data.items ?? []
  } catch {
    return []
  }
}

async function shareTask(
  taskId: string,
  recipients: { userId?: string; teamId?: string }[],
  role: AssigneeRole,
  message?: string,
  mode: ShareMode = "share"
): Promise<void> {
  // For share mode, add assignees
  // For copy mode, would create copies (future feature)
  if (mode === "copy") {
    // TODO: Implement copy mode when API is available
    throw new Error("Copy mode not yet implemented")
  }

  // Add each recipient as assignee
  for (const recipient of recipients) {
    if (recipient.userId) {
      // eslint-disable-next-line no-restricted-syntax -- route constant not yet defined
      const res = await fetch(`/api/v1/tasks/${taskId}/assignees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: recipient.userId, role }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to share task")
      }
    }
    // TODO: Handle team sharing when API supports it
  }
}

// ============ Selected Recipient Badge ============
function RecipientBadge({
  recipient,
  type,
  onRemove,
}: {
  recipient: Team | TeamMember
  type: RecipientType
  onRemove: () => void
}) {
  const isTeam = type === "team"
  const team = recipient as Team
  const member = recipient as TeamMember

  const label = isTeam ? team.name : (member.displayName ?? member.email ?? "Unknown")
  const initials = label
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted group">
      {isTeam ? (
        <Users className="h-4 w-4 text-muted-foreground" />
      ) : (
        <Avatar className="h-5 w-5">
          <AvatarImage src={member.avatar ?? undefined} />
          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
        </Avatar>
      )}
      <span className="text-xs font-medium truncate max-w-24">{label}</span>
      <button onClick={onRemove} className="ml-1">
        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
      </button>
    </div>
  )
}

// ============ Main Component ============
export function PushToTeamModal({
  taskId,
  taskTitle,
  taskIds = [],
  trigger,
  onSuccess,
}: PushToTeamModalProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<ShareMode>("share")
  const [role, setRole] = useState<AssigneeRole>("assignee")
  const [message, setMessage] = useState("")
  const [selectedTeams, setSelectedTeams] = useState<Team[]>([])
  const [selectedMembers, setSelectedMembers] = useState<TeamMember[]>([])
  const queryClient = useQueryClient()

  // Fetch teams
  const { data: teams = [], isLoading: loadingTeams } = useQuery({
    queryKey: ["teams"],
    queryFn: fetchTeams,
    enabled: open,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch members
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ["team-members"],
    queryFn: () => fetchTeamMembers(),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  })

  // Share mutation
  const shareMutation = useMutation({
    mutationFn: async () => {
      const ids = taskIds.length > 0 ? taskIds : [taskId]
      const recipients = [
        ...selectedTeams.map((t) => ({ teamId: t.id })),
        ...selectedMembers.map((m) => ({ userId: m.userId })),
      ]

      for (const id of ids) {
        await shareTask(id, recipients, role, message, mode)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-assignees"] })
      toast.success(
        taskIds.length > 1
          ? `Shared ${taskIds.length} tasks successfully`
          : "Task shared successfully"
      )
      setOpen(false)
      resetForm()
      onSuccess?.()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const resetForm = useCallback(() => {
    setMode("share")
    setRole("assignee")
    setMessage("")
    setSelectedTeams([])
    setSelectedMembers([])
  }, [])

  const handleSelectTeam = useCallback((team: Team) => {
    setSelectedTeams((prev) =>
      prev.some((t) => t.id === team.id)
        ? prev.filter((t) => t.id !== team.id)
        : [...prev, team]
    )
  }, [])

  const handleSelectMember = useCallback((member: TeamMember) => {
    setSelectedMembers((prev) =>
      prev.some((m) => m.userId === member.userId)
        ? prev.filter((m) => m.userId !== member.userId)
        : [...prev, member]
    )
  }, [])

  const handleRemoveTeam = useCallback((teamId: string) => {
    setSelectedTeams((prev) => prev.filter((t) => t.id !== teamId))
  }, [])

  const handleRemoveMember = useCallback((userId: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m.userId !== userId))
  }, [])

  const hasSelection = selectedTeams.length > 0 || selectedMembers.length > 0
  const taskCount = taskIds.length > 0 ? taskIds.length : 1

  return (
    <ClientDialog open={open} onOpenChange={setOpen}>
      <ClientDialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        )}
      </ClientDialogTrigger>
      <ClientDialogContent className="sm:max-w-lg">
        <ClientDialogHeader>
          <ClientDialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {taskCount > 1 ? `Share ${taskCount} Tasks` : "Share Task"}
          </ClientDialogTitle>
          <ClientDialogDescription>
            {taskCount > 1 ? (
              `Share ${taskCount} selected tasks with your team`
            ) : (
              <>Share &quot;{taskTitle}&quot; with team members</>
            )}
          </ClientDialogDescription>
        </ClientDialogHeader>

        <div className="space-y-4 py-4">
          {/* Share Mode */}
          <div className="flex items-center justify-between">
            <Label htmlFor="share-mode">Mode</Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Share</span>
                <Switch
                  id="share-mode"
                  checked={mode === "copy"}
                  onCheckedChange={(checked) => setMode(checked ? "copy" : "share")}
                />
                <span className="text-sm">Copy</span>
                <Copy className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="flex items-center justify-between">
            <Label>Permission</Label>
            <ClientSelect value={role} onValueChange={(v) => setRole(v as AssigneeRole)}>
              <ClientSelectTrigger className="w-40">
                <ClientSelectValue />
              </ClientSelectTrigger>
              <ClientSelectContent>
                <ClientSelectItem value="assignee">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Assignee
                  </span>
                </ClientSelectItem>
                <ClientSelectItem value="reviewer">
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Reviewer
                  </span>
                </ClientSelectItem>
                <ClientSelectItem value="observer">
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Observer
                  </span>
                </ClientSelectItem>
              </ClientSelectContent>
            </ClientSelect>
          </div>

          {/* Selected Recipients */}
          {hasSelection && (
            <div className="flex flex-wrap gap-2">
              {selectedTeams.map((team) => (
                <RecipientBadge
                  key={`team-${team.id}`}
                  recipient={team}
                  type="team"
                  onRemove={() => handleRemoveTeam(team.id)}
                />
              ))}
              {selectedMembers.map((member) => (
                <RecipientBadge
                  key={`member-${member.userId}`}
                  recipient={member}
                  type="member"
                  onRemove={() => handleRemoveMember(member.userId)}
                />
              ))}
            </div>
          )}

          {/* Team & Member Selector */}
          <Command className="border rounded-md">
            <CommandInput placeholder="Search teams or members..." />
            <CommandList className="max-h-48">
              <CommandEmpty>No teams or members found</CommandEmpty>

              {/* Teams */}
              {teams.length > 0 && (
                <CommandGroup heading="Teams">
                  {loadingTeams ? (
                    <div className="p-2">
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : (
                    teams.map((team) => {
                      const isSelected = selectedTeams.some((t) => t.id === team.id)
                      return (
                        <CommandItem
                          key={team.id}
                          value={team.name}
                          onSelect={() => handleSelectTeam(team)}
                        >
                          <Checkbox checked={isSelected} className="mr-2" />
                          <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{team.name}</span>
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {team.memberCount} members
                          </Badge>
                        </CommandItem>
                      )
                    })
                  )}
                </CommandGroup>
              )}

              <CommandSeparator />

              {/* Members */}
              <CommandGroup heading="Members">
                {loadingMembers ? (
                  <div className="p-2 space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : (
                  members.map((member) => {
                    const isSelected = selectedMembers.some((m) => m.userId === member.userId)
                    const initials = (member.displayName ?? "?")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)

                    return (
                      <CommandItem
                        key={member.userId}
                        value={member.displayName ?? member.email ?? member.userId}
                        onSelect={() => handleSelectMember(member)}
                      >
                        <Checkbox checked={isSelected} className="mr-2" />
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={member.avatar ?? undefined} />
                          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm">{member.displayName ?? "Unknown"}</span>
                          {member.email && (
                            <span className="text-xs text-muted-foreground">{member.email}</span>
                          )}
                        </div>
                      </CommandItem>
                    )
                  })
                )}
              </CommandGroup>
            </CommandList>
          </Command>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a note for recipients..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </div>
        </div>

        <ClientDialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => shareMutation.mutate()}
            disabled={!hasSelection || shareMutation.isPending}
          >
            {shareMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 mr-2" />
                {mode === "copy" ? "Copy" : "Share"}
                {taskCount > 1 && ` ${taskCount} Tasks`}
              </>
            )}
          </Button>
        </ClientDialogFooter>
      </ClientDialogContent>
    </ClientDialog>
  )
}

export default PushToTeamModal
