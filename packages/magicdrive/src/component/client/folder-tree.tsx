/**
 * @layer domain (magicdrive)
 * @responsibility Folder tree sidebar component.
 */

"use client"

import * as React from "react"
import { ChevronRight, Folder, FolderOpen, Plus } from "lucide-react"
import { cn } from "@afenda/shared/utils"
import type { FolderTreeNode } from "../../zod/magicdrive.folder.zod"

export interface FolderTreeProps {
  tree: FolderTreeNode[]
  selectedFolderId: string | null
  onFolderSelect: (folderId: string | null) => void
  onFolderCreate?: (parentId: string | null) => void
  className?: string
}

export function FolderTree({
  tree,
  selectedFolderId,
  onFolderSelect,
  onFolderCreate,
  className,
}: FolderTreeProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {/* Root folder (All Documents) */}
      <FolderTreeItem
        id={null}
        name="All Documents"
        depth={0}
        isSelected={selectedFolderId === null}
        hasChildren={false}
        onSelect={() => onFolderSelect(null)}
      />

      {/* Folder tree */}
      {tree.map((node) => (
        <FolderTreeNode
          key={node.id}
          node={node}
          depth={0}
          selectedFolderId={selectedFolderId}
          onFolderSelect={onFolderSelect}
        />
      ))}

      {/* Add folder button */}
      {onFolderCreate && (
        <button
          onClick={() => onFolderCreate(null)}
          className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Folder</span>
        </button>
      )}
    </div>
  )
}

interface FolderTreeNodeProps {
  node: FolderTreeNode
  depth: number
  selectedFolderId: string | null
  onFolderSelect: (folderId: string | null) => void
}

function FolderTreeNode({
  node,
  depth,
  selectedFolderId,
  onFolderSelect,
}: FolderTreeNodeProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const hasChildren = node.children.length > 0

  return (
    <div>
      <FolderTreeItem
        id={node.id}
        name={node.name}
        color={node.color}
        depth={depth}
        isSelected={selectedFolderId === node.id}
        isExpanded={isExpanded}
        hasChildren={hasChildren}
        documentCount={node.documentCount}
        onSelect={() => onFolderSelect(node.id)}
        onToggle={() => setIsExpanded(!isExpanded)}
      />

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="ml-2">
          {node.children.map((child) => (
            <FolderTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedFolderId={selectedFolderId}
              onFolderSelect={onFolderSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface FolderTreeItemProps {
  id: string | null
  name: string
  color?: string | null
  depth: number
  isSelected: boolean
  isExpanded?: boolean
  hasChildren: boolean
  documentCount?: number
  onSelect: () => void
  onToggle?: () => void
}

function FolderTreeItem({
  name,
  color,
  depth,
  isSelected,
  isExpanded,
  hasChildren,
  documentCount,
  onSelect,
  onToggle,
}: FolderTreeItemProps) {
  const FolderIcon = isExpanded ? FolderOpen : Folder

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
        isSelected
          ? "bg-accent text-accent-foreground"
          : "hover:bg-accent/50"
      )}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
      onClick={onSelect}
    >
      {/* Expand/collapse toggle */}
      {hasChildren ? (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggle?.()
          }}
          className="p-0.5 hover:bg-accent rounded"
        >
          <ChevronRight
            className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "rotate-90"
            )}
          />
        </button>
      ) : (
        <div className="w-5" />
      )}

      {/* Folder icon */}
      <FolderIcon
        className="h-4 w-4 flex-shrink-0"
        style={{ color: color || undefined }}
      />

      {/* Folder name */}
      <span className="flex-1 truncate text-sm">{name}</span>

      {/* Document count */}
      {documentCount !== undefined && documentCount > 0 && (
        <span className="text-xs text-muted-foreground">{documentCount}</span>
      )}
    </div>
  )
}
