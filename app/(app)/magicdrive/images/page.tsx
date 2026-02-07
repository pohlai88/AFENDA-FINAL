/**
 * @domain magicdrive
 * @layer ui
 * @responsibility MagicDrive images page - image file browser
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
  Image as ImageIcon,
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
} from "lucide-react"

// Mock data
const mockImages = [
  {
    id: "1",
    name: "vacation-photo.jpg",
    type: "jpg",
    size: "3.2 MB",
    modified: "2 hours ago",
    starred: true,
    dimensions: "1920x1080"
  },
  {
    id: "2",
    name: "screenshot.png",
    type: "png",
    size: "1.5 MB",
    modified: "5 hours ago",
    starred: false,
    dimensions: "1366x768"
  },
  {
    id: "3",
    name: "logo-design.svg",
    type: "svg",
    size: "45 KB",
    modified: "1 day ago",
    starred: true,
    dimensions: "Vector"
  },
  {
    id: "4",
    name: "profile-picture.jpg",
    type: "jpg",
    size: "856 KB",
    modified: "3 days ago",
    starred: false,
    dimensions: "512x512"
  },
  {
    id: "5",
    name: "banner-design.png",
    type: "png",
    size: "4.7 MB",
    modified: "1 week ago",
    starred: false,
    dimensions: "2560x1440"
  },
  {
    id: "6",
    name: "product-photo.jpg",
    type: "jpg",
    size: "2.1 MB",
    modified: "2 weeks ago",
    starred: false,
    dimensions: "1600x1200"
  },
]

export default function ImagesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
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
    if (selectedFiles.length === mockImages.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(mockImages.map(f => f.id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Images</h1>
          <p className="text-muted-foreground">
            Browse and manage your image files
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Create Album
          </Button>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Images
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">JPG</Badge>
          <Badge variant="secondary">PNG</Badge>
          <Badge variant="secondary">SVG</Badge>
          <Badge variant="secondary">GIF</Badge>
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
                {selectedFiles.length} image{selectedFiles.length > 1 ? "s" : ""} selected
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
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Images Grid/List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedFiles.length === mockImages.length && mockImages.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <CardTitle className="text-sm font-normal text-muted-foreground">
                Image Name
              </CardTitle>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Size</span>
              <span>Dimensions</span>
              <span>Modified</span>
              <span>Actions</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {viewMode === "list" ? (
            <div className="divide-y">
              {mockImages.map((image) => (
                <div
                  key={image.id}
                  className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedFiles.includes(image.id)}
                    onCheckedChange={() => handleSelectFile(image.id)}
                  />
                  <ImageIcon className="h-8 w-8 text-purple-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{image.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {image.modified}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{image.size}</span>
                    <span>{image.dimensions}</span>
                    <span>{image.modified}</span>
                  </div>
                  {image.starred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
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
                        {image.starred ? "Unstar" : "Star"}
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
              {mockImages.map((image) => (
                <div
                  key={image.id}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer relative"
                >
                  <Checkbox
                    className="absolute top-2 left-2"
                    checked={selectedFiles.includes(image.id)}
                    onCheckedChange={() => handleSelectFile(image.id)}
                  />
                  <div className="w-full h-24 bg-muted rounded-md flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-purple-500" />
                  </div>
                  <p className="text-sm font-medium text-center truncate w-full">
                    {image.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{image.size}</p>
                  {image.starred && (
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
