/**
 * Shared Saved Views UI Components
 * Pure presentational components (props in, events out)
 */

"use client";

import * as React from "react";
import { Save, FolderOpen, Star, Trash2, Edit2, Check } from "lucide-react";
import {
  Button,
  ClientDropdownMenu,
  ClientDropdownMenuContent,
  ClientDropdownMenuTrigger,
  ClientDialog,
  ClientDialogContent,
  ClientDialogDescription,
  ClientDialogFooter,
  ClientDialogHeader,
  ClientDialogTitle,
  Input,
  Label,
  Textarea,
  Badge,
  ScrollArea,
} from "@afenda/shadcn";
import { cn } from "@afenda/shadcn/lib/utils";

import type { SavedView, SavedViewManagerProps } from "./types";
import { isFiltersEmpty } from "./types";

/**
 * Saved view badge component
 */
export function SavedViewBadge({
  view,
  isActive,
  onClick,
}: {
  view: SavedView;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <Badge
      variant={isActive ? "default" : "secondary"}
      className={cn("gap-1 cursor-pointer", onClick && "hover:bg-accent")}
      onClick={onClick}
    >
      {view.isDefault && <Star className="h-3 w-3 fill-current" />}
      {view.name}
    </Badge>
  );
}

/**
 * Save view dialog
 */
function SaveViewDialog({
  open,
  onOpenChange,
  onSave,
  hasFilters,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, description?: string) => void;
  hasFilters: boolean;
}) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), description.trim() || undefined);
    setName("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <ClientDialog open={open} onOpenChange={onOpenChange}>
      <ClientDialogContent>
        <ClientDialogHeader>
          <ClientDialogTitle>Save Current View</ClientDialogTitle>
          <ClientDialogDescription>
            Save your current filter configuration for quick access later.
          </ClientDialogDescription>
        </ClientDialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="view-name">View Name *</Label>
            <Input
              id="view-name"
              placeholder="e.g., High Priority Items"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="view-description">Description (optional)</Label>
            <Textarea
              id="view-description"
              placeholder="Describe what this view shows..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          {!hasFilters && (
            <p className="text-sm text-muted-foreground">
              Note: No filters are currently applied. The saved view will show all items.
            </p>
          )}
        </div>
        <ClientDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            <Save className="h-4 w-4 mr-2" />
            Save View
          </Button>
        </ClientDialogFooter>
      </ClientDialogContent>
    </ClientDialog>
  );
}

/**
 * Saved view manager component (pure UI)
 */
export function SavedViewManager<TFilter = unknown>({
  currentFilters,
  savedViews,
  onApplyView,
  onSaveView,
  onUpdateView,
  onDeleteView,
  onSetDefault,
  disabled = false,
  maxViews,
}: SavedViewManagerProps<TFilter>) {
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [editingView, setEditingView] = React.useState<SavedView<TFilter> | null>(null);

  const hasFilters = !isFiltersEmpty(currentFilters);
  const canSaveMore = !maxViews || savedViews.length < maxViews;
  const defaultView = savedViews.find((v) => v.isDefault);

  const handleSaveView = (name: string, description?: string) => {
    onSaveView({
      name,
      description,
      filters: currentFilters,
      isDefault: savedViews.length === 0,
    });
  };

  const handleUpdateView = (viewId: string, name: string, description?: string) => {
    onUpdateView(viewId, { name, description });
    setEditingView(null);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Save current view button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setSaveDialogOpen(true)}
        disabled={disabled || !canSaveMore}
        className="gap-2"
      >
        <Save className="h-4 w-4" />
        Save View
        {hasFilters && (
          <Badge variant="secondary" className="ml-1">
            {typeof currentFilters === "object" && currentFilters !== null && !Array.isArray(currentFilters)
              ? Object.keys(currentFilters as Record<string, unknown>).length
              : "Active"}
          </Badge>
        )}
      </Button>

      {/* Saved views dropdown */}
      {savedViews.length > 0 && (
        <ClientDropdownMenu>
          <ClientDropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={disabled} className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Saved Views
              <Badge variant="secondary">{savedViews.length}</Badge>
            </Button>
          </ClientDropdownMenuTrigger>
          <ClientDropdownMenuContent align="start" className="w-80">
            <ScrollArea className="max-h-96">
              <div className="p-2 space-y-1">
                {savedViews.map((view) => (
                  <div
                    key={view.id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-accent group"
                  >
                    <button
                      type="button"
                      onClick={() => onApplyView(view.filters)}
                      className="flex-1 text-left space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        {view.isDefault && (
                          <Star className="h-3 w-3 fill-current text-yellow-500" />
                        )}
                        <span className="font-medium text-sm">{view.name}</span>
                      </div>
                      {view.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {view.description}
                        </p>
                      )}
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onSetDefault && !view.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onSetDefault(view.id)}
                          title="Set as default"
                        >
                          <Star className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setEditingView(view)}
                        title="Edit view"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive"
                        onClick={() => onDeleteView(view.id)}
                        title="Delete view"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            {maxViews && savedViews.length >= maxViews && (
              <div className="p-2 border-t">
                <p className="text-xs text-muted-foreground text-center">
                  Maximum {maxViews} saved views reached
                </p>
              </div>
            )}
          </ClientDropdownMenuContent>
        </ClientDropdownMenu>
      )}

      {/* Default view indicator */}
      {defaultView && (
        <Badge variant="outline" className="gap-1">
          <Star className="h-3 w-3 fill-current" />
          {defaultView.name}
        </Badge>
      )}

      {/* Save dialog */}
      <SaveViewDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveView}
        hasFilters={hasFilters}
      />

      {/* Edit dialog */}
      {editingView && (
        <EditViewDialog
          view={editingView}
          onClose={() => setEditingView(null)}
          onUpdate={handleUpdateView}
        />
      )}
    </div>
  );
}

/**
 * Edit view dialog — uses React refs instead of DOM queries.
 */
function EditViewDialog<TFilter = unknown>({
  view,
  onClose,
  onUpdate,
}: {
  view: SavedView<TFilter>;
  onClose: () => void;
  onUpdate: (viewId: string, name: string, description?: string) => void;
}) {
  const nameRef = React.useRef<HTMLInputElement>(null);
  const descRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const name = nameRef.current?.value ?? view.name;
    const desc = descRef.current?.value;
    onUpdate(view.id, name, desc || undefined);
  };

  return (
    <ClientDialog open onOpenChange={() => onClose()}>
      <ClientDialogContent>
        <ClientDialogHeader>
          <ClientDialogTitle>Edit View</ClientDialogTitle>
        </ClientDialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-view-name">View Name</Label>
            <Input
              ref={nameRef}
              id="edit-view-name"
              defaultValue={view.name}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-view-description">Description</Label>
            <Textarea
              ref={descRef}
              id="edit-view-description"
              defaultValue={view.description || ""}
              rows={3}
            />
          </div>
        </div>
        <ClientDialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            <Check className="h-4 w-4 mr-2" />
            Update
          </Button>
        </ClientDialogFooter>
      </ClientDialogContent>
    </ClientDialog>
  );
}
