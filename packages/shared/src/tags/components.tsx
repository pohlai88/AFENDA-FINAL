/**
 * Shared Tags UI Components
 * Pure presentational components (props in, events out)
 */

"use client";

import * as React from "react";
import { X, Plus, Tag as TagIcon } from "lucide-react";
import {
  Badge,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Input,
  Label,
  ScrollArea,
  Separator,
} from "@afenda/shadcn";
import { cn } from "@afenda/shadcn/lib/utils";

import type { Tag, Taggable, TagPickerProps } from "./types";

/**
 * Tag display component
 */
export function TagBadge({
  tag,
  onRemove,
  disabled,
}: {
  tag: Tag;
  onRemove?: () => void;
  disabled?: boolean;
}) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1 pr-1",
        tag.color && `bg-${tag.color}-100 text-${tag.color}-800 border-${tag.color}-200`
      )}
    >
      <TagIcon className="h-3 w-3" />
      {tag.name}
      {onRemove && !disabled && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 rounded-full hover:bg-black/10 p-0.5"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
}

/**
 * Tag picker component (pure UI)
 */
export function TagPicker<T extends Taggable>({
  entity,
  availableTags,
  onAddTag,
  onRemoveTag,
  onCreateTag,
  disabled = false,
  maxTags,
}: TagPickerProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const [newTagName, setNewTagName] = React.useState("");

  const entityTags = entity.tags ?? [];
  const entityTagIds = new Set(entityTags.map((t) => t.id));

  // Filter available tags
  const filteredTags = availableTags.filter(
    (tag) =>
      !entityTagIds.has(tag.id) &&
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canAddMore = !maxTags || entityTags.length < maxTags;

  const handleAddTag = (tagId: string) => {
    if (!canAddMore) return;
    onAddTag(tagId);
    setSearchQuery("");
  };

  const handleCreateTag = () => {
    if (!newTagName.trim() || !onCreateTag) return;
    onCreateTag({ name: newTagName.trim() });
    setNewTagName("");
    setIsCreating(false);
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Display current tags */}
      {entityTags.map((tag) => (
        <TagBadge
          key={tag.id}
          tag={tag}
          onRemove={() => onRemoveTag(tag.id)}
          disabled={disabled}
        />
      ))}

      {/* Add tag button */}
      {canAddMore && !disabled && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-6 gap-1">
              <Plus className="h-3 w-3" />
              Add Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-3 space-y-3">
              {/* Search input */}
              <div className="space-y-1">
                <Label htmlFor="tag-search">Search tags</Label>
                <Input
                  id="tag-search"
                  placeholder="Search or create tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Available tags */}
              <ScrollArea className="h-48">
                <div className="space-y-1">
                  {filteredTags.length > 0 ? (
                    filteredTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleAddTag(tag.id)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent text-left"
                      >
                        <TagIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1">{tag.name}</span>
                        {tag.description && (
                          <span className="text-xs text-muted-foreground">
                            {tag.description}
                          </span>
                        )}
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No tags found
                    </p>
                  )}
                </div>
              </ScrollArea>

              {/* Create new tag */}
              {onCreateTag && (
                <>
                  <Separator />
                  {isCreating ? (
                    <div className="space-y-2">
                      <Label htmlFor="new-tag-name">New tag name</Label>
                      <div className="flex gap-2">
                        <Input
                          id="new-tag-name"
                          placeholder="Tag name"
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreateTag();
                            if (e.key === "Escape") setIsCreating(false);
                          }}
                        />
                        <Button size="sm" onClick={handleCreateTag}>
                          Create
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsCreating(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setIsCreating(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create new tag
                    </Button>
                  )}
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Max tags indicator */}
      {maxTags && entityTags.length >= maxTags && (
        <span className="text-xs text-muted-foreground">
          Max {maxTags} tags
        </span>
      )}
    </div>
  );
}
