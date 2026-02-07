/**
 * @domain magictodo
 * @layer ui
 * @responsibility UI route entrypoint for /app/projects
 */

"use client"

import { useEffect, useState } from "react"
import { PlusCircle, Folder, FolderOpen, MoreHorizontal, Edit, Trash2 } from "lucide-react"

import { Button } from "@afenda/shadcn"
import { Card, CardContent, CardHeader, CardTitle } from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@afenda/shadcn"
import { Spinner } from "@afenda/shadcn"
import { Alert, AlertDescription } from "@afenda/shadcn"
import {
  ClientDropdownMenu,
  ClientDropdownMenuContent,
  ClientDropdownMenuItem,
  ClientDropdownMenuSeparator,
  ClientDropdownMenuTrigger,
} from "@afenda/shadcn"
import {
  ClientDialog,
  ClientDialogContent,
  ClientDialogHeader,
  ClientDialogTitle,
  ClientDialogFooter,
} from "@afenda/shadcn"
import { Input } from "@afenda/shadcn"
import { Label } from "@afenda/shadcn"
import { Textarea } from "@afenda/shadcn"
import { useUser } from "@/app/_components/user-context"
import { useProjectsStore, type ProjectResponse } from "@afenda/magictodo"

export default function ProjectsPage() {
  const { user, isLoading, isAuthenticated } = useUser()
  const {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProjectApi,
    deleteProject,
  } = useProjectsStore()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectResponse | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
  })

  // Track client mount for hydration safety (intentional one-off sync)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (user?.id) {
      fetchProjects(user.id)
    }
  }, [user?.id, fetchProjects])

  const handleCreateProject = async () => {
    if (!user?.id || !formData.name.trim()) return

    await createProject(user.id, {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      color: formData.color,
    })
    setShowCreateDialog(false)
    setFormData({ name: "", description: "", color: "#3b82f6" })
  }

  const handleEditProject = async () => {
    if (!user?.id || !editingProject || !formData.name.trim()) return

    await updateProjectApi(user.id, editingProject.id, {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      color: formData.color,
    })

    setShowEditDialog(false)
    setEditingProject(null)
    setFormData({ name: "", description: "", color: "#3b82f6" })
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!user?.id) return

    if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      await deleteProject(user.id, projectId)
    }
  }

  const openEditDialog = (project: ProjectResponse) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      description: project.description || "",
      color: project.color || "#3b82f6",
    })
    setShowEditDialog(true)
  }

  // Prevent hydration mismatch by rendering consistent skeleton on server and initial client render
  if (!isMounted) {
    return (
      <div className="space-y-4" suppressHydrationWarning>
        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-64 w-full animate-pulse rounded-md bg-muted" />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Alert>
          <Spinner className="h-5 w-5" />
          <AlertDescription>Loading authentication...</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!isAuthenticated || !user?.id) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>Not authenticated. Please log in.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Organize your tasks into projects for better management.
        </p>
      </div>

      <Card>
        <CardHeader className="border-b px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Projects</CardTitle>
            <Button
              onClick={() => setShowCreateDialog(true)}
              size="sm"
              className="gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
              <Spinner className="size-4" />
              Loading projects…
            </div>
          ) : projects.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <Folder className="h-12 w-12 text-muted-foreground" />
                <EmptyTitle>No projects yet</EmptyTitle>
                <EmptyDescription>
                  Create your first project to start organizing your tasks.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card key={project.id} className="group hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: project.color || "#3b82f6" }}
                        />
                        <h3 className="font-medium truncate">{project.name}</h3>
                      </div>
                      <ClientDropdownMenu>
                        <ClientDropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </ClientDropdownMenuTrigger>
                        <ClientDropdownMenuContent align="end">
                          <ClientDropdownMenuItem onClick={() => openEditDialog(project)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </ClientDropdownMenuItem>
                          <ClientDropdownMenuSeparator />
                          <ClientDropdownMenuItem
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </ClientDropdownMenuItem>
                        </ClientDropdownMenuContent>
                      </ClientDropdownMenu>
                    </div>

                    {project.description && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {project.taskCount || 0} tasks
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <FolderOpen className="h-3 w-3" />
                        Active
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Create Project Dialog */}
      <ClientDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <ClientDialogContent className="max-w-md">
          <ClientDialogHeader>
            <ClientDialogTitle>Create New Project</ClientDialogTitle>
          </ClientDialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter project name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter project description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-20"
                />
                <span className="text-sm text-muted-foreground">{formData.color}</span>
              </div>
            </div>
          </div>
          <ClientDialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={!formData.name.trim()}>
              Create Project
            </Button>
          </ClientDialogFooter>
        </ClientDialogContent>
      </ClientDialog>

      {/* Edit Project Dialog */}
      <ClientDialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <ClientDialogContent className="max-w-md">
          <ClientDialogHeader>
            <ClientDialogTitle>Edit Project</ClientDialogTitle>
          </ClientDialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                placeholder="Enter project name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea
                id="edit-description"
                placeholder="Enter project description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-color">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-20"
                />
                <span className="text-sm text-muted-foreground">{formData.color}</span>
              </div>
            </div>
          </div>
          <ClientDialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditProject} disabled={!formData.name.trim()}>
              Update Project
            </Button>
          </ClientDialogFooter>
        </ClientDialogContent>
      </ClientDialog>
    </div>
  )
}

