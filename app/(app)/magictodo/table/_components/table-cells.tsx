/**
 * Table cell components for MagicTodo table view.
 * Extracted from page.tsx for maintainability.
 *
 * @domain magictodo
 * @layer ui/component
 */

"use client";

import { useEffect, useState, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@afenda/shadcn";
import { Input } from "@afenda/shadcn";
import {
  ClientSelect,
  ClientSelectContent,
  ClientSelectItem,
  ClientSelectTrigger,
} from "@afenda/shadcn";
import {
  ClientPopover,
  ClientPopoverContent,
  ClientPopoverTrigger,
} from "@afenda/shadcn";
import {
  ClientTooltip,
  ClientTooltipContent,
  ClientTooltipProvider,
  ClientTooltipTrigger,
} from "@afenda/shadcn";
import { Calendar as CalendarPicker } from "@afenda/shadcn";
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  GripVertical,
  Pin,
  Star,
  Paperclip,
  FileImage,
  FileText,
  File,
} from "lucide-react";
import { cn } from "@afenda/shared/utils";
import { formatDate, isOverdue } from "./table-utils";

// ─── Types ───────────────────────────────────────────────────────────

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  url?: string;
}

// ─── Priority & Status Config ────────────────────────────────────────

export const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"] as const;
export const STATUS_OPTIONS = ["todo", "in_progress", "done", "cancelled"] as const;

export const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  urgent: { color: "bg-red-500 text-white", label: "Urgent" },
  high: { color: "bg-orange-500 text-white", label: "High" },
  medium: { color: "bg-yellow-500 text-black", label: "Medium" },
  low: { color: "bg-blue-500 text-white", label: "Low" },
};

export const STATUS_CONFIG: Record<string, { icon: typeof Circle; color: string; label: string }> = {
  todo: { icon: Circle, color: "text-gray-500", label: "To Do" },
  in_progress: { icon: Clock, color: "text-blue-500", label: "In Progress" },
  done: { icon: CheckCircle2, color: "text-green-500", label: "Done" },
  cancelled: { icon: Circle, color: "text-red-500", label: "Cancelled" },
};

// ─── Priority Badge ──────────────────────────────────────────────────

export function PriorityBadge({ priority }: { priority?: string }) {
  if (!priority) return null;
  const config = PRIORITY_CONFIG[priority];
  if (!config) return null;
  return (
    <Badge variant="outline" className={cn("text-xs", config.color)}>
      {config.label}
    </Badge>
  );
}

// ─── Status Cell ─────────────────────────────────────────────────────

export function StatusCell({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.todo;
  const Icon = config.icon;
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn("h-4 w-4", config.color)} />
      <span className="text-sm">{config.label}</span>
    </div>
  );
}

// ─── Sortable Header (DnD Column Reordering) ────────────────────────

export function SortableHeader({
  headerId,
  children,
}: {
  headerId: string;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: headerId });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1">
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab hover:bg-muted rounded p-0.5 active:cursor-grabbing"
        aria-label="Drag to reorder column"
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </button>
      {children}
    </div>
  );
}

// ─── Editable Text Cell ──────────────────────────────────────────────

export function EditableTextCell({
  value,
  onSave,
  isEditing,
  onStartEdit,
  onCancelEdit,
}: {
  value: string;
  onSave: (value: string) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
}) {
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSave(editValue);
    } else if (e.key === "Escape") {
      setEditValue(value);
      onCancelEdit();
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={() => onSave(editValue)}
        onKeyDown={handleKeyDown}
        className="h-7 text-sm"
      />
    );
  }

  return (
    <div
      className="cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 truncate"
      onClick={onStartEdit}
    >
      {value || <span className="text-muted-foreground">—</span>}
    </div>
  );
}

// ─── Editable Select Cell ────────────────────────────────────────────

export function EditableSelectCell<T extends string>({
  value,
  options,
  onSave,
  renderValue,
}: {
  value: T;
  options: readonly T[];
  onSave: (value: T) => void;
  renderValue: (value: T) => React.ReactNode;
}) {
  return (
    <ClientSelect value={value} onValueChange={(v) => onSave(v as T)}>
      <ClientSelectTrigger className="h-7 border-0 bg-transparent hover:bg-muted/50 p-1">
        {renderValue(value)}
      </ClientSelectTrigger>
      <ClientSelectContent>
        {options.map((opt) => (
          <ClientSelectItem key={opt} value={opt}>
            {renderValue(opt)}
          </ClientSelectItem>
        ))}
      </ClientSelectContent>
    </ClientSelect>
  );
}

// ─── Editable Date Cell ──────────────────────────────────────────────

export function EditableDateCell({
  value,
  onSave,
}: {
  value: string | null;
  onSave: (value: string | null) => void;
}) {
  const date = value ? new Date(value) : undefined;
  const overdue = isOverdue(value);

  return (
    <ClientPopover>
      <ClientPopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1 hover:bg-muted/50 rounded px-1 py-0.5",
            overdue && "text-red-500"
          )}
        >
          <Calendar className="h-3 w-3" />
          <span className="text-sm">{formatDate(value)}</span>
        </button>
      </ClientPopoverTrigger>
      <ClientPopoverContent className="w-auto p-0" align="start">
        <CalendarPicker
          mode="single"
          selected={date}
          onSelect={(d) => onSave(d ? d.toISOString() : null)}
          initialFocus
        />
      </ClientPopoverContent>
    </ClientPopover>
  );
}

// ─── Pin/Star Toggle Cell ────────────────────────────────────────────

export function PinStarCell({
  isPinned,
  isStarred,
  onTogglePin,
  onToggleStar,
}: {
  isPinned?: boolean | null;
  isStarred?: boolean | null;
  onTogglePin: () => void;
  onToggleStar: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
        className={cn(
          "p-0.5 rounded hover:bg-muted transition-colors",
          isPinned ? "text-orange-500" : "text-muted-foreground"
        )}
        aria-label={isPinned ? "Unpin task" : "Pin task"}
      >
        <Pin className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onToggleStar(); }}
        className={cn(
          "p-0.5 rounded hover:bg-muted transition-colors",
          isStarred ? "text-yellow-500" : "text-muted-foreground"
        )}
        aria-label={isStarred ? "Unstar task" : "Star task"}
      >
        <Star className={cn("h-3.5 w-3.5", isStarred && "fill-current")} />
      </button>
    </div>
  );
}

// ─── Attachment Preview Cell ─────────────────────────────────────────

export function AttachmentPreviewCell({ attachments }: { attachments?: Attachment[] }) {
  if (!attachments || attachments.length === 0) return null;

  const getIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return FileImage;
    if (mimeType.includes("pdf") || mimeType.includes("document")) return FileText;
    return File;
  };

  return (
    <ClientTooltipProvider>
      <ClientTooltip>
        <ClientTooltipTrigger asChild>
          <div className="flex items-center gap-1 cursor-pointer hover:bg-muted/50 rounded px-1">
            <Paperclip className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{attachments.length}</span>
          </div>
        </ClientTooltipTrigger>
        <ClientTooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            {attachments.slice(0, 5).map((att) => {
              const Icon = getIcon(att.mimeType);
              return (
                <div key={att.id} className="flex items-center gap-2 text-xs">
                  <Icon className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{att.filename}</span>
                </div>
              );
            })}
            {attachments.length > 5 && (
              <div className="text-xs text-muted-foreground">
                +{attachments.length - 5} more files
              </div>
            )}
          </div>
        </ClientTooltipContent>
      </ClientTooltip>
    </ClientTooltipProvider>
  );
}
