/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Standardized document actions dropdown
 * Features: Consistent actions, loading states, proper error handling, accessibility
 */

"use client"

import { useState } from "react"
import { Button } from "@afenda/shadcn"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@afenda/shadcn"
import {
  MoreVertical,
  Eye,
  Download,
  Share2,
  Tag,
  Archive,
  Trash2,
  Copy,
  FileOutput,
} from "lucide-react"
import { useDocumentAction, type DocumentAction } from "../utils/document-actions"

export interface DocumentActionsDropdownProps {
  documentId: string
  documentTitle?: string | null
  size?: "sm" | "lg" | "icon" | "icon-sm"
  variant?: "ghost" | "outline" | "secondary"
  align?: "start" | "center" | "end"
  disabled?: boolean
  onActionComplete?: (action: DocumentAction) => void
  onError?: (action: DocumentAction, error: Error) => void
  // Allow custom action configuration
  actions?: DocumentAction[]
  excludeActions?: DocumentAction[]
}

const DEFAULT_ACTIONS: DocumentAction[] = [
  'view',
  'download',
  'share',
  'tag',
  'archive',
]

const EXTENDED_ACTIONS: DocumentAction[] = [
  'view',
  'download',
  'share',
  'tag',
  'archive',
  'duplicate',
  'export',
]

export function DocumentActionsDropdown({
  documentId,
  documentTitle,
  size = "icon-sm",
  variant = "ghost",
  align = "end",
  disabled = false,
  onActionComplete,
  onError,
  actions = DEFAULT_ACTIONS,
  excludeActions = [],
}: DocumentActionsDropdownProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const documentActions = useDocumentAction({
    documentId,
    documentTitle,
    onActionComplete: (action) => {
      setLoading(null)
      onActionComplete?.(action)
    },
    onError: (action, error) => {
      setLoading(null)
      onError?.(action, error)
    },
  })

  // Filter actions based on configuration
  const availableActions = actions.filter(action => !excludeActions.includes(action))

  // Separate regular actions from delete action
  const regularActions = availableActions.filter(action => action !== 'delete' as DocumentAction)
  const shouldShowDelete = !excludeActions.includes('delete' as DocumentAction)

  const handleAction = async (action: DocumentAction) => {
    if (loading) return

    setLoading(action)
    try {
      await documentActions.executeAction(action)
    } catch (_error) {
      // Error handling is done in the useDocumentAction hook
    }
  }

  type DocumentActionType = DocumentAction | 'delete'

const getActionIcon = (action: DocumentActionType) => {
    switch (action) {
      case 'view':
        return <Eye className="h-4 w-4" />
      case 'download':
        return <Download className="h-4 w-4" />
      case 'share':
        return <Share2 className="h-4 w-4" />
      case 'tag':
        return <Tag className="h-4 w-4" />
      case 'archive':
        return <Archive className="h-4 w-4" />
      case 'delete':
        return <Trash2 className="h-4 w-4" />
      case 'duplicate':
        return <Copy className="h-4 w-4" />
      case 'export':
        return <FileOutput className="h-4 w-4" />
      default:
        return <MoreVertical className="h-4 w-4" />
    }
  }

  const getActionLabel = (action: DocumentActionType) => {
    switch (action) {
      case 'view':
        return 'View'
      case 'download':
        return 'Download'
      case 'share':
        return 'Share'
      case 'delete':
        return 'Delete'
      case 'tag':
        return 'Add Tags'
      case 'archive':
        return 'Archive'
      case 'delete':
        return 'Delete'
      case 'duplicate':
        return 'Duplicate'
      case 'export':
        return 'Export'
      default:
        return 'Unknown'
    }
  }

  const getButtonSize = () => {
    switch (size) {
      case "sm":
        return "h-8 w-8 p-0"
      case "lg":
        return "h-10 w-10 p-0"
      case "icon":
        return "size-9"
      case "icon-sm":
        return "size-8"
      default:
        return "size-8"
    }
  }

  const getIconSize = () => {
    switch (size) {
      case "sm":
        return "h-4 w-4"
      case "lg":
        return "h-5 w-5"
      case "icon":
        return "h-4 w-4"
      case "icon-sm":
        return "h-4 w-4"
      default:
        return "h-4 w-4"
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={getButtonSize()}
          disabled={disabled || !!loading}
        >
          {loading ? (
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <MoreVertical className={getIconSize()} />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-48">
        {regularActions.map((action) => (
          <DropdownMenuItem
            key={action}
            onClick={() => handleAction(action)}
            disabled={loading === action}
            className={action === 'delete' ? 'text-destructive focus:text-destructive' : ''}
          >
            {getActionIcon(action)}
            <span className="ml-2">{getActionLabel(action)}</span>
            {loading === action && (
              <div className="ml-auto animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
            )}
          </DropdownMenuItem>
        ))}

        {/* Add separator if there are dangerous actions */}
        {shouldShowDelete && regularActions.length > 0 && (
          <DropdownMenuSeparator />
        )}

        {/* Dangerous actions */}
        {shouldShowDelete && (
          <DropdownMenuItem
            onClick={() => handleAction('delete')}
            disabled={loading === 'delete'}
            className="text-destructive focus:text-destructive"
          >
            {getActionIcon('delete')}
            <span className="ml-2">{getActionLabel('delete')}</span>
            {loading === 'delete' && (
              <div className="ml-auto animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
            )}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Preset configurations for different use cases
export function DocumentActionsDropdownMinimal(props: Omit<DocumentActionsDropdownProps, 'actions'>) {
  return (
    <DocumentActionsDropdown
      {...props}
      actions={['view', 'download', 'share']}
    />
  )
}

export function DocumentActionsDropdownExtended(props: Omit<DocumentActionsDropdownProps, 'actions'>) {
  return (
    <DocumentActionsDropdown
      {...props}
      actions={EXTENDED_ACTIONS}
    />
  )
}

export function DocumentActionsDropdownWithDelete(props: Omit<DocumentActionsDropdownProps, 'actions'>) {
  return (
    <DocumentActionsDropdown
      {...props}
      actions={[...DEFAULT_ACTIONS, 'delete']}
    />
  )
}
