/**
 * @domain magicdrive
 * @layer ui
 * @responsibility MagicDrive documents page - document file browser
 */

"use client"

import { useState } from "react"
import { Button } from "@afenda/shadcn"
import { Card, CardContent, CardHeader, CardTitle } from "@afenda/shadcn"
import { Input } from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import { Checkbox } from "@afenda/shadcn"
import {
  ClientDropdownMenu,
  ClientDropdownMenuContent,
  ClientDropdownMenuItem,
  ClientDropdownMenuSeparator,
  ClientDropdownMenuTrigger,
} from "@afenda/shadcn"
import {
  FileText,
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
  Eye,
  FileSpreadsheet,
} from "lucide-react"

// Mock data
const mockDocuments = [
  {
    id: "1",
    name: "Q4-Financial-Report.pdf",
    type: "pdf",
    size: "2.3 MB",
    modified: "2 hours ago",
    starred: true,
    pages: 45
  },
  {
    id: "2",
    name: "Project-Proposal.docx",
    type: "docx",
    size: "856 KB",
    modified: "5 hours ago",
    starred: false,
    pages: 12
  },
  {
    id: "3",
    name: "Budget-2024.xlsx",
    type: "xlsx",
    size: "1.2 MB",
    modified: "1 day ago",
    starred: true,
    sheets: 5
  },
  {
    id: "4",
    name: "Meeting-Notes.txt",
    type: "txt",
    size: "24 KB",
    modified: "3 hours ago",
    starred: false
  },
  {
    id: "5",
    name: "Presentation.pptx",
    type: "pptx",
    size: "5.7 MB",
    modified: "2 days ago",
    starred: false,
    slides: 24
  },
  {
    id: "6",
    name: "Contract-Draft.pdf",
    type: "pdf",
    size: "345 KB",
    modified: "1 week ago",
    starred: false,
    pages: 15
  },
]

const getDocumentIcon = (type: string) => {
  switch (type) {
    case "pdf":
      return <FileText className="h-8 w-8 text-red-500" />
    case "docx":
      return <FileText className="h-8 w-8 text-blue-500" />
    case "xlsx":
      return <FileSpreadsheet className="h-8 w-8 text-green-500" />
    case "pptx":
      return <FileText className="h-8 w-8 text-orange-500" />
    case "txt":
      return <FileText className="h-8 w-8 text-gray-500" />
    default:
      return <File className="h-8 w-8 text-gray-400" />
  }
}

export default function DocumentsPage() {
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
    if (selectedFiles.length === mockDocuments.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(mockDocuments.map(f => f.id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Browse and manage your document files
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Document
          </Button>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Documents
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">PDF</Badge>
          <Badge variant="secondary">Word</Badge>
          <Badge variant="secondary">Excel</Badge>
          <Badge variant="secondary">PowerPoint</Badge>
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
                {selectedFiles.length} document{selectedFiles.length > 1 ? "s" : ""} selected
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

      {/* Documents List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedFiles.length === mockDocuments.length && mockDocuments.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <CardTitle className="text-sm font-normal text-muted-foreground">
                Document Name
              </CardTitle>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Size</span>
              <span>Modified</span>
              <span>Actions</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {viewMode === "list" ? (
            <div className="divide-y">
              {mockDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedFiles.includes(doc.id)}
                    onCheckedChange={() => handleSelectFile(doc.id)}
                  />
                  {getDocumentIcon(doc.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.pages && `${doc.pages} pages • `}
                      {doc.sheets && `${doc.sheets} sheets • `}
                      {doc.slides && `${doc.slides} slides • `}
                      {doc.modified}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{doc.size}</span>
                    <span>{doc.modified}</span>
                  </div>
                  {doc.starred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                  <ClientDropdownMenu>
                    <ClientDropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </ClientDropdownMenuTrigger>
                    <ClientDropdownMenuContent align="end">
                      <ClientDropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </ClientDropdownMenuItem>
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
                        {doc.starred ? "Unstar" : "Star"}
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
              {mockDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="relative flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <Checkbox
                    className="absolute top-2 left-2"
                    checked={selectedFiles.includes(doc.id)}
                    onCheckedChange={() => handleSelectFile(doc.id)}
                  />
                  {getDocumentIcon(doc.type)}
                  <p className="text-sm font-medium text-center truncate w-full mt-4">
                    {doc.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{doc.size}</p>
                  {doc.starred && (
                    <Star className="h-4 w-4 text-yellow-500 fill-current absolute top-2 right-2" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
