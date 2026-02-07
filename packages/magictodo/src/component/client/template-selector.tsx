/**
 * TemplateSelector Component
 * 
 * @domain magictodo
 * @layer component/client
 * @responsibility Select a task template to create a new task
 */

"use client"

import { useState, useCallback } from "react"
import {
  Button,
  ClientDialog,
  ClientDialogContent,
  ClientDialogDescription,
  ClientDialogHeader,
  ClientDialogTitle,
  ClientDialogTrigger,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Input,
} from "@afenda/shadcn"
import { cn } from "@afenda/shared/utils"
import { FileText, Plus, Search, Loader2, Users } from "lucide-react"
import type { TaskTemplate } from "@afenda/magictodo/zod"

export interface TemplateSelectorProps {
  templates: TaskTemplate[]
  isLoading?: boolean
  onSelectTemplate?: (template: TaskTemplate) => Promise<void>
  onCreateFromTemplate?: (templateId: string) => Promise<void>
  triggerButton?: React.ReactNode
}

export function TemplateSelector({
  templates,
  isLoading = false,
  onSelectTemplate,
  onCreateFromTemplate,
  triggerButton,
}: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelect = useCallback(async (template: TaskTemplate) => {
    setSelectedId(template.id)
    setIsCreating(true)
    
    try {
      if (onCreateFromTemplate) {
        await onCreateFromTemplate(template.id)
      } else if (onSelectTemplate) {
        await onSelectTemplate(template)
      }
      setIsOpen(false)
    } finally {
      setIsCreating(false)
      setSelectedId(null)
    }
  }, [onSelectTemplate, onCreateFromTemplate])

  return (
    <ClientDialog open={isOpen} onOpenChange={setIsOpen}>
      <ClientDialogTrigger asChild>
        {triggerButton ?? (
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Use Template
          </Button>
        )}
      </ClientDialogTrigger>
      <ClientDialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <ClientDialogHeader>
          <ClientDialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Task from Template
          </ClientDialogTitle>
          <ClientDialogDescription>
            Select a template to quickly create a new task with predefined settings.
          </ClientDialogDescription>
        </ClientDialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Templates list */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <FileText className="h-12 w-12 mb-2 opacity-50" />
              {searchQuery ? (
                <>
                  <p className="font-medium">No templates found</p>
                  <p className="text-sm">Try a different search term</p>
                </>
              ) : (
                <>
                  <p className="font-medium">No templates yet</p>
                  <p className="text-sm">Create your first template to get started</p>
                </>
              )}
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <Card 
                key={template.id}
                className={cn(
                  "cursor-pointer transition-colors",
                  "hover:bg-muted/50",
                  selectedId === template.id && "border-primary bg-primary/5"
                )}
                onClick={() => handleSelect(template)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      {template.name}
                      {template.isShared && (
                        <Badge variant="secondary" className="gap-1">
                          <Users className="h-3 w-3" />
                          Shared
                        </Badge>
                      )}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      disabled={isCreating}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelect(template)
                      }}
                    >
                      {isCreating && selectedId === template.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                {template.description && (
                  <CardContent className="pt-0">
                    <CardDescription className="line-clamp-2">
                      {template.description}
                    </CardDescription>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </ClientDialogContent>
    </ClientDialog>
  )
}
