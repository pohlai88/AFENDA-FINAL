/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Download form component using shadcn form blocks
 * Features: Batch download, format selection, quality options, progress tracking
 */

"use client"

import { useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { cn } from "@afenda/shared/utils"
import { Button } from "@afenda/shadcn"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@afenda/shadcn"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@afenda/shadcn"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@afenda/shadcn"
import { Checkbox } from "@afenda/shadcn"
import { Input } from "@afenda/shadcn"
import { Textarea } from "@afenda/shadcn"
import { Progress } from "@afenda/shadcn"
import {
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react"

const downloadFormSchema = z.object({
  format: z.enum(["pdf", "jpg", "png", "original"], {
    message: "Please select a download format",
  }),
  quality: z.enum(["high", "medium", "low"], {
    message: "Please select a quality level",
  }),
  compression: z.boolean().optional().default(false),
  includeMetadata: z.boolean().optional().default(true),
  customName: z.string().optional(),
  notes: z.string().optional(),
  selectedDocuments: z.array(z.string()).min(1, "Please select at least one document"),
})

type DownloadFormValues = z.infer<typeof downloadFormSchema>

export interface DownloadFormProps {
  documents: Array<{
    id: string
    title: string | null
    docType: string
    status: string
    createdAt: string
    tags?: { id: string; name: string; slug: string }[]
    version?: {
      id: string
      mimeType: string
      sizeBytes: number
      sha256: string
    }
  }>
  selectedIds: Set<string>
  onToggleSelection: (id: string) => void
  className?: string
}

export function DownloadForm({
  documents,
  selectedIds,
  onToggleSelection,
  className,
}: DownloadFormProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "preparing" | "downloading" | "completed" | "error">("idle")

  const form = useForm<DownloadFormValues>({
    resolver: zodResolver(downloadFormSchema as any) as any,
    defaultValues: {
      format: "original",
      quality: "high",
      compression: false,
      includeMetadata: true,
      customName: "",
      notes: "",
      selectedDocuments: Array.from(selectedIds),
    },
  })

  // Get selected documents from form value directly to avoid memoization issues
  const selectedDocuments = form.watch("selectedDocuments")

  // Update form when selection changes
  const handleDocumentToggle = useCallback((documentId: string) => {
    onToggleSelection(documentId)
    const currentSelected = form.getValues("selectedDocuments")
    const newSelected = currentSelected.includes(documentId)
      ? currentSelected.filter(id => id !== documentId)
      : [...currentSelected, documentId]
    form.setValue("selectedDocuments", newSelected)
  }, [onToggleSelection, form])

  const onSubmit = useCallback(async (data: DownloadFormValues) => {
    setIsDownloading(true)
    setDownloadStatus("preparing")
    setDownloadProgress(0)

    try {
      // Simulate preparation phase
      await new Promise(resolve => setTimeout(resolve, 1000))
      setDownloadStatus("downloading")
      setDownloadProgress(25)

      // Simulate download progress
      for (let i = 0; i <= 100; i += 5) {
        await new Promise(resolve => setTimeout(resolve, 100))
        setDownloadProgress(i)
      }

      setDownloadStatus("completed")

      // Create download link (simulation)
      const downloadData = {
        documents: data.selectedDocuments,
        format: data.format,
        quality: data.quality,
        compression: data.compression,
        includeMetadata: data.includeMetadata,
        customName: data.customName,
        notes: data.notes,
      }


      // Reset after completion
      setTimeout(() => {
        setIsDownloading(false)
        setDownloadStatus("idle")
        setDownloadProgress(0)
      }, 2000)

    } catch (error) {
      console.error("Download failed:", error)
      setDownloadStatus("error")
      setIsDownloading(false)
    }
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getTotalSize = useCallback(() => {
    return documents
      .filter(doc => selectedDocuments.includes(doc.id))
      .reduce((total, doc) => total + (doc.version?.sizeBytes || 0), 0)
  }, [documents, selectedDocuments])

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download Documents
          </CardTitle>
          <CardDescription>
            Configure and download your selected documents in various formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
              {/* Document Selection */}
              <div className="space-y-3">
                <FormLabel className="text-base font-medium">Selected Documents</FormLabel>
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                  {documents.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No documents available</p>
                  ) : (
                    <div className="space-y-2">
                      {documents.map((document) => (
                        <div
                          key={document.id}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors",
                            selectedDocuments.includes(document.id)
                              ? "bg-primary/5 border-primary/20"
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => handleDocumentToggle(document.id)}
                        >
                          <Checkbox
                            checked={selectedDocuments.includes(document.id)}
                            onChange={() => { }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {document.title || 'Untitled Document'}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="capitalize">{document.docType}</span>
                              {document.version && (
                                <span>{formatFileSize(document.version.sizeBytes)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedDocuments.length > 0 && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{selectedDocuments.length} documents selected</span>
                    <span>Total size: {formatFileSize(getTotalSize())}</span>
                  </div>
                )}
                <FormMessage />
              </div>

              {/* Format Selection */}
              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Download Format</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="original">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Original Format
                          </div>
                        </SelectItem>
                        <SelectItem value="pdf">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            PDF
                          </div>
                        </SelectItem>
                        <SelectItem value="jpg">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            JPEG
                          </div>
                        </SelectItem>
                        <SelectItem value="png">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            PNG
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the format for your downloaded files
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Quality Selection */}
              <FormField
                control={form.control}
                name="quality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quality</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select quality" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="high">High (Best quality)</SelectItem>
                        <SelectItem value="medium">Medium (Balanced)</SelectItem>
                        <SelectItem value="low">Low (Smaller size)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Higher quality results in larger file sizes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Options */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="compression"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Compress files</FormLabel>
                        <FormDescription>
                          Create a ZIP archive to reduce download size
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="includeMetadata"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Include metadata</FormLabel>
                        <FormDescription>
                          Add document information and tags to download
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Custom Name */}
              <FormField
                control={form.control}
                name="customName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Name (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="My documents archive"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Custom name for the downloaded files or archive
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any notes about this download..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Download Progress */}
              {isDownloading && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {downloadStatus === "completed" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : downloadStatus === "error" ? (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    ) : (
                      <Download className="h-4 w-4 animate-pulse" />
                    )}
                    <span className="text-sm font-medium">
                      {downloadStatus === "preparing" && "Preparing download..."}
                      {downloadStatus === "downloading" && "Downloading..."}
                      {downloadStatus === "completed" && "Download completed!"}
                      {downloadStatus === "error" && "Download failed. Please try again."}
                    </span>
                  </div>
                  {(downloadStatus === "preparing" || downloadStatus === "downloading") && (
                    <Progress value={downloadProgress} className="w-full" />
                  )}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={isDownloading}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={isDownloading || selectedDocuments.length === 0}
                >
                  {isDownloading ? (
                    <>
                      <Download className="mr-2 h-4 w-4 animate-pulse" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download {selectedDocuments.length} Document{selectedDocuments.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
