/**
 * @domain magicdrive
 * @layer utils
 * @responsibility Standardized document actions and dropdown functionality
 * Features: Consistent actions across all views, proper error handling, loading states
 */

"use client"

import { toast } from "sonner"
import { routes } from "@afenda/shared/constants"

export type DocumentAction =
  | 'view'
  | 'download'
  | 'share'
  | 'tag'
  | 'archive'
  | 'delete'
  | 'duplicate'
  | 'export'

export interface DocumentActionHandlerProps {
  documentId: string
  documentTitle?: string | null
  onActionComplete?: (action: DocumentAction) => void
  onError?: (action: DocumentAction, error: Error) => void
}

export class DocumentActionHandler {
  private document: DocumentActionHandlerProps

  constructor(props: DocumentActionHandlerProps) {
    this.document = props
  }

  async executeAction(action: DocumentAction): Promise<void> {
    try {
      switch (action) {
        case 'view':
          await this.handleView()
          break
        case 'download':
          await this.handleDownload()
          break
        case 'share':
          await this.handleShare()
          break
        case 'tag':
          await this.handleTag()
          break
        case 'archive':
          await this.handleArchive()
          break
        case 'delete':
          await this.handleDelete()
          break
        case 'duplicate':
          await this.handleDuplicate()
          break
        case 'export':
          await this.handleExport()
          break
        default:
          throw new Error(`Unknown action: ${action}`)
      }

      this.document.onActionComplete?.(action)
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error')
      this.document.onError?.(action, err)
      throw err
    }
  }

  private async handleView(): Promise<void> {
    // Navigate to document detail page
    window.location.href = routes.ui.magicdrive.documentById(this.document.documentId)
  }

  private async handleDownload(): Promise<void> {
    try {
      // Get download URL from API
      const response = await fetch(routes.api.v1.magicdrive.objectSourceUrl(this.document.documentId), {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to get download URL')
      }

      const data = await response.json()
      if (!data.data?.url) {
        throw new Error('No download URL available')
      }

      // Create download link
      const link = document.createElement('a')
      link.href = data.data.url
      link.download = this.document.documentTitle || 'document'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Download started')
    } catch (error) {
      toast.error('Download failed')
      throw error
    }
  }

  private async handleShare(): Promise<void> {
    // Copy share link to clipboard
    const shareUrl = `${window.location.origin}${routes.ui.magicdrive.documentById(this.document.documentId)}`

    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Share link copied to clipboard')
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      toast.success('Share link copied to clipboard')
    }
  }

  private async handleTag(): Promise<void> {
    // Open tag dialog (this would integrate with a tag management system)
    toast.info('Tag management coming soon')
    // In a real implementation, this would open a dialog for adding/editing tags
  }

  private async handleArchive(): Promise<void> {
    try {
      const response = await fetch(routes.api.v1.magicdrive.objectById(this.document.documentId), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'archived'
        }),
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to archive document')
      }

      toast.success('Document archived')
      // In a real implementation, this would trigger a refresh of the document list
    } catch (error) {
      toast.error('Failed to archive document')
      throw error
    }
  }

  private async handleDelete(): Promise<void> {
    // Confirm deletion
    const confirmed = window.confirm('Are you sure you want to delete this document? This action cannot be undone.')

    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(routes.api.v1.magicdrive.objectById(this.document.documentId), {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to delete document')
      }

      toast.success('Document deleted')
      // In a real implementation, this would trigger a refresh of the document list
    } catch (error) {
      toast.error('Failed to delete document')
      throw error
    }
  }

  private async handleDuplicate(): Promise<void> {
    try {
      const response = await fetch(routes.api.v1.magicdrive.objectDuplicate(this.document.documentId), {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to duplicate document')
      }

      toast.success('Document duplicated')
      // In a real implementation, this would trigger a refresh of the document list
    } catch (error) {
      toast.error('Failed to duplicate document')
      throw error
    }
  }

  private async handleExport(): Promise<void> {
    try {
      const response = await fetch(routes.api.v1.magicdrive.objectExport(this.document.documentId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: 'pdf' // Default format, could be made configurable
        }),
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to export document')
      }

      const data = await response.json()
      if (data.data?.url) {
        const link = document.createElement('a')
        link.href = data.data.url
        link.download = `${this.document.documentTitle || 'document'}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      toast.success('Document exported')
    } catch (error) {
      toast.error('Failed to export document')
      throw error
    }
  }
}

// Hook for easy usage in components
export function useDocumentAction(props: DocumentActionHandlerProps) {
  const handler = new DocumentActionHandler(props)

  return {
    executeAction: handler.executeAction.bind(handler),
    // Convenience methods for common actions
    view: () => handler.executeAction('view'),
    download: () => handler.executeAction('download'),
    share: () => handler.executeAction('share'),
    tag: () => handler.executeAction('tag'),
    archive: () => handler.executeAction('archive'),
    delete: () => handler.executeAction('delete'),
    duplicate: () => handler.executeAction('duplicate'),
    export: () => handler.executeAction('export'),
  }
}
