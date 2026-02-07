/**
 * SubtaskList Component
 * 
 * @domain magictodo
 * @layer component/client
 * @responsibility Display and manage subtasks for a task
 */

"use client"

import { useState, useCallback } from "react"
import { Button, Checkbox, Input } from "@afenda/shadcn"
import { cn } from "@afenda/shared/utils"
import { Plus, Trash2, GripVertical, Loader2 } from "lucide-react"
import type { Subtask } from "@afenda/magictodo/zod"

export interface SubtaskListProps {
  taskId: string
  subtasks: Subtask[]
  isLoading?: boolean
  onAddSubtask?: (title: string) => Promise<void>
  onToggleSubtask?: (subtaskId: string, completed: boolean) => Promise<void>
  onUpdateSubtask?: (subtaskId: string, title: string) => Promise<void>
  onDeleteSubtask?: (subtaskId: string) => Promise<void>
  onReorderSubtasks?: (subtaskIds: string[]) => Promise<void>
  readonly?: boolean
}

export function SubtaskList({
  taskId: _taskId,
  subtasks,
  isLoading = false,
  onAddSubtask,
  onToggleSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onReorderSubtasks,
  readonly = false,
}: SubtaskListProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")

  const completedCount = subtasks.filter((s) => s.completed).length
  const progress = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0

  const handleAddSubtask = useCallback(async () => {
    if (!newSubtaskTitle.trim() || !onAddSubtask) return
    
    setIsAdding(true)
    try {
      await onAddSubtask(newSubtaskTitle.trim())
      setNewSubtaskTitle("")
    } finally {
      setIsAdding(false)
    }
  }, [newSubtaskTitle, onAddSubtask])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddSubtask()
    }
  }, [handleAddSubtask])

  const handleStartEdit = useCallback((subtask: Subtask) => {
    setEditingId(subtask.id)
    setEditingTitle(subtask.title)
  }, [])

  const handleSaveEdit = useCallback(async () => {
    if (!editingId || !editingTitle.trim() || !onUpdateSubtask) return
    
    await onUpdateSubtask(editingId, editingTitle.trim())
    setEditingId(null)
    setEditingTitle("")
  }, [editingId, editingTitle, onUpdateSubtask])

  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
    setEditingTitle("")
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading subtasks...</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      {subtasks.length > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Subtasks</span>
            <span>{completedCount} of {subtasks.length}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtask list */}
      <ul className="space-y-1">
        {subtasks.map((subtask) => (
          <li 
            key={subtask.id}
            className={cn(
              "group flex items-center gap-2 rounded-md px-2 py-1.5",
              "hover:bg-muted/50 transition-colors",
              subtask.completed && "opacity-60"
            )}
          >
            {/* Drag handle */}
            {!readonly && onReorderSubtasks && (
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
            
            {/* Checkbox */}
            <Checkbox
              checked={subtask.completed}
              disabled={readonly}
              onCheckedChange={(checked) => {
                onToggleSubtask?.(subtask.id, checked === true)
              }}
              className="shrink-0"
            />
            
            {/* Title (editable or static) */}
            {editingId === subtask.id ? (
              <Input
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit()
                  if (e.key === "Escape") handleCancelEdit()
                }}
                className="h-7 flex-1 text-sm"
                autoFocus
              />
            ) : (
              <span 
                className={cn(
                  "flex-1 text-sm cursor-default",
                  subtask.completed && "line-through",
                  !readonly && "cursor-text"
                )}
                onDoubleClick={() => !readonly && handleStartEdit(subtask)}
              >
                {subtask.title}
              </span>
            )}
            
            {/* Delete button */}
            {!readonly && onDeleteSubtask && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                onClick={() => onDeleteSubtask(subtask.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </li>
        ))}
      </ul>

      {/* Add subtask input */}
      {!readonly && onAddSubtask && (
        <div className="flex items-center gap-2">
          <Input
            placeholder="Add a subtask..."
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isAdding}
            className="h-8 text-sm"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleAddSubtask}
            disabled={isAdding || !newSubtaskTitle.trim()}
          >
            {isAdding ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
