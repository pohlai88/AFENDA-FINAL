/**
 * @domain magicdrive
 * @layer ui
 * @responsibility MagicDrive files page - file browser and management
 */

"use client"

import { useState } from "react"
import { Button } from "@afenda/shadcn"
import { Card, CardContent, CardHeader, CardTitle } from "@afenda/shadcn"
import { Input } from "@afenda/shadcn"
import { Checkbox } from "@afenda/shadcn"
import {
  ClientDropdownMenu,
  ClientDropdownMenuContent,
  ClientDropdownMenuItem,
  ClientDropdownMenuSeparator,
  ClientDropdownMenuTrigger,
} from "@afenda/shadcn"
import {
  Folder,
  File,
  Upload,
  Plus,
  Search,
  Grid3x3,
  List,
  MoreVertical,
  Download,
  Share2,
  Star,
  Trash2,
  Edit,
  Copy,
  Move,
} from "lucide-react"

// Mock data
const mockFiles = [
  { id: "1", name: "Documents", type: "folder", size: "-", modified: "2 hours ago", starred: true },
  { id: "2", name: "Images", type: "folder", size: "-", modified: "3 days ago", starred: false },
  { id: "3", name: "project-report.pdf", type: "file", size: "2.3 MB", modified: "1 hour ago", starred: true },
  { id: "4", name: "presentation.pptx", type: "file", size: "5.7 MB", modified: "5 hours ago", starred: false },
  { id: "5", name: "budget-2024.xlsx", type: "file", size: "1.2 MB", modified: "1 day ago", starred: false },
  { id: "6", name: "meeting-notes.docx", type: "file", size: "245 KB", modified: "3 hours ago", starred: false },
]

export default function FilesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const handleSelectFile = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
  }

  const handleSelectAll = () => {
    if (selectedFiles.length === mockFiles.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(mockFiles.map(f => f.id))
    }
  }

  const getFileIcon = (type: string) => {
    return type === "folder" ? (
      <Folder className="h-8 w-8 text-blue-500" />
    ) : (
      <File className="h-8 w-8 text-gray-400" />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Files</h1>
          <p className="text-muted-foreground">
            Browse and manage all your files and folders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Files
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files and folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Actions Bar */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedFiles.length} item{selectedFiles.length > 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <Move className="mr-2 h-4 w-4" />
                  Move
                </Button>
                <Button variant="outline" size="sm">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Files List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedFiles.length === mockFiles.length && mockFiles.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Name
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {viewMode === "list" ? (
            <div className="divide-y">
              {mockFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedFiles.includes(file.id)}
                    onCheckedChange={() => handleSelectFile(file.id)}
                  />
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.modified} • {file.size}
                    </p>
                  </div>
                  {file.starred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                  <ClientDropdownMenu>
                    <ClientDropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </ClientDropdownMenuTrigger>
                    <ClientDropdownMenuContent align="end">
                      <ClientDropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </ClientDropdownMenuItem>
                      <ClientDropdownMenuItem>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </ClientDropdownMenuItem>
                      <ClientDropdownMenuItem>
                        <Star className="mr-2 h-4 w-4" />
                        {file.starred ? "Unstar" : "Star"}
                      </ClientDropdownMenuItem>
                      <ClientDropdownMenuSeparator />
                      <ClientDropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Rename
                      </ClientDropdownMenuItem>
                      <ClientDropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </ClientDropdownMenuItem>
                      <ClientDropdownMenuItem>
                        <Move className="mr-2 h-4 w-4" />
                        Move
                      </ClientDropdownMenuItem>
                      <ClientDropdownMenuSeparator />
                      <ClientDropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </ClientDropdownMenuItem>
                    </ClientDropdownMenuContent>
                  </ClientDropdownMenu>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
              {mockFiles.map((file) => (
                <div
                  key={file.id}
                  className="relative flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <Checkbox
                    className="absolute top-2 left-2"
                    checked={selectedFiles.includes(file.id)}
                    onCheckedChange={() => handleSelectFile(file.id)}
                  />
                  {getFileIcon(file.type)}
                  <p className="text-sm font-medium text-center truncate w-full">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{file.size}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
