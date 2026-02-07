/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Document preview hover card using shadcn HoverCard
 */

"use client"

import { FileText, Image, Video, File } from "lucide-react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import type { DocumentItem } from "@afenda/magicdrive/zustand"

interface DocumentPreviewHoverProps {
  document: DocumentItem
  children: React.ReactNode
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Math.round(bytes / Math.pow(k, i) * 100) / 100} ${sizes[i]}`
}

function getDocumentIcon(docType: string) {
  const type = docType?.toLowerCase()
  if (["image", "jpg", "png", "gif", "webp"].includes(type)) {
    return { icon: Image, bgColor: "bg-blue-100 dark:bg-blue-900", iconColor: "text-blue-600 dark:text-blue-400" }
  }
  if (["video", "mp4", "mov", "avi"].includes(type)) {
    return { icon: Video, bgColor: "bg-purple-100 dark:bg-purple-900", iconColor: "text-purple-600 dark:text-purple-400" }
  }
  if (["pdf"].includes(type)) {
    return { icon: FileText, bgColor: "bg-red-100 dark:bg-red-900", iconColor: "text-red-600 dark:text-red-400" }
  }
  if (["doc", "docx", "txt"].includes(type)) {
    return { icon: FileText, bgColor: "bg-blue-100 dark:bg-blue-900", iconColor: "text-blue-600 dark:text-blue-400" }
  }
  return { icon: File, bgColor: "bg-muted", iconColor: "text-muted-foreground" }
}

function getDocumentTypeName(docType: string): string {
  const type = docType?.toLowerCase()
  if (["image", "jpg", "png", "gif", "webp"].includes(type)) return "Image"
  if (["video", "mp4", "mov", "avi"].includes(type)) return "Video"
  if (["pdf"].includes(type)) return "PDF Document"
  if (["doc", "docx"].includes(type)) return "Word Document"
  if (["txt"].includes(type)) return "Text File"
  return "Document"
}

export function DocumentPreviewHover({ document, children }: DocumentPreviewHoverProps) {
  const { icon: Icon, bgColor, iconColor } = getDocumentIcon(document.docType)
  const typeName = getDocumentTypeName(document.docType)

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded ${bgColor}`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="font-semibold text-sm">{document.title || "Untitled"}</h4>
              <p className="text-muted-foreground text-xs">
                {formatFileSize(document.version?.sizeBytes || 0)} · {typeName}
              </p>
            </div>
          </div>
          
          {document.tags && document.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {document.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
          
          <p className="text-muted-foreground text-xs">
            Created: {new Date(document.createdAt).toLocaleDateString()}
            {document.updatedAt && document.updatedAt !== document.createdAt && (
              <> · Modified: {new Date(document.updatedAt).toLocaleDateString()}</>
            )}
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
