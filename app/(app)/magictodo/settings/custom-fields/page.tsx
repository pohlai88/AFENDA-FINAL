/**
 * @domain magictodo
 * @layer ui
 * @responsibility Custom Fields settings page with CRUD for field definitions
 */

"use client"

import { useState, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@afenda/shadcn"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import { Skeleton } from "@afenda/shadcn"
import {
  ClientDropdownMenu,
  ClientDropdownMenuContent,
  ClientDropdownMenuItem,
  ClientDropdownMenuTrigger,
} from "@afenda/shadcn"
import {
  ClientAlertDialog,
  ClientAlertDialogAction,
  ClientAlertDialogCancel,
  ClientAlertDialogContent,
  ClientAlertDialogDescription,
  ClientAlertDialogFooter,
  ClientAlertDialogHeader,
  ClientAlertDialogTitle,
} from "@afenda/shadcn"
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  GripVertical,
  Type,
  Hash,
  ToggleLeft,
  Calendar,
  Clock,
  List,
  ChevronDown,
  Settings,
} from "lucide-react"
import { cn } from "@afenda/shared/utils"
import { toast } from "sonner"
import {
  FieldDefinitionForm,
  FIELD_TYPE,
  type FieldType,
  type FieldDefinitionResponse,
  type CreateFieldDefinitionRequest,
} from "@afenda/magictodo"
import { routes } from "@afenda/shared/constants";

/** BFF endpoint for custom fields (frontend calls BFF per architecture). */
const customFieldsApi = () =>
  `${routes.api.magictodo.bff.root()}/custom-fields`;

// ============ API Functions ============
async function fetchFieldDefinitions(): Promise<FieldDefinitionResponse[]> {
  const res = await fetch(customFieldsApi())
  if (!res.ok) throw new Error("Failed to fetch field definitions")
  const data = await res.json()
  return data.data?.items ?? []
}

async function createFieldDefinition(
  data: CreateFieldDefinitionRequest
): Promise<FieldDefinitionResponse> {
  const res = await fetch(customFieldsApi(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message ?? "Failed to create field")
  }
  const result = await res.json()
  return result.data
}

async function updateFieldDefinition(
  id: string,
  data: Partial<CreateFieldDefinitionRequest>
): Promise<FieldDefinitionResponse> {
  const res = await fetch(`${customFieldsApi()}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message ?? "Failed to update field")
  }
  const result = await res.json()
  return result.data
}

async function deleteFieldDefinition(id: string): Promise<void> {
  const res = await fetch(`${customFieldsApi()}/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message ?? "Failed to delete field")
  }
}

async function reorderFieldDefinitions(ids: string[]): Promise<void> {
  // Reorder by updating sort_order for each
  for (let i = 0; i < ids.length; i++) {
    await fetch(`${customFieldsApi()}/${ids[i]}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sortOrder: i }),
    })
  }
}

// ============ Field Type Icons ============
const FIELD_TYPE_ICONS: Record<FieldType, typeof Type> = {
  [FIELD_TYPE.TEXT]: Type,
  [FIELD_TYPE.NUMBER]: Hash,
  [FIELD_TYPE.BOOLEAN]: ToggleLeft,
  [FIELD_TYPE.DATE]: Calendar,
  [FIELD_TYPE.TIMESTAMP]: Clock,
  [FIELD_TYPE.JSON]: List,
  [FIELD_TYPE.SELECT]: ChevronDown,
}

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  [FIELD_TYPE.TEXT]: "Text",
  [FIELD_TYPE.NUMBER]: "Number",
  [FIELD_TYPE.BOOLEAN]: "Boolean",
  [FIELD_TYPE.DATE]: "Date",
  [FIELD_TYPE.TIMESTAMP]: "Date & Time",
  [FIELD_TYPE.JSON]: "JSON / List",
  [FIELD_TYPE.SELECT]: "Select",
}

// ============ Sortable Field Card ============
interface SortableFieldCardProps {
  field: FieldDefinitionResponse
  onEdit: (field: FieldDefinitionResponse) => void
  onDelete: (field: FieldDefinitionResponse) => void
}

function SortableFieldCard({ field, onEdit, onDelete }: SortableFieldCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const Icon = FIELD_TYPE_ICONS[field.fieldType as FieldType] ?? Type

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-4 bg-card border rounded-lg",
        isDragging && "shadow-lg"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab hover:bg-muted rounded p-1"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="p-2 rounded-md bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{field.name}</span>
            {field.alias && (
              <Badge variant="secondary" className="text-xs">
                {field.alias}
              </Badge>
            )}
          </div>
          {field.description && (
            <p className="text-sm text-muted-foreground truncate">
              {field.description}
            </p>
          )}
        </div>
        <Badge variant="outline" className="hidden sm:inline-flex">
          {FIELD_TYPE_LABELS[field.fieldType as FieldType] ?? field.fieldType}
        </Badge>
      </div>

      <ClientDropdownMenu>
        <ClientDropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </ClientDropdownMenuTrigger>
        <ClientDropdownMenuContent align="end">
          <ClientDropdownMenuItem onClick={() => onEdit(field)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </ClientDropdownMenuItem>
          <ClientDropdownMenuItem
            onClick={() => onDelete(field)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </ClientDropdownMenuItem>
        </ClientDropdownMenuContent>
      </ClientDropdownMenu>
    </div>
  )
}

// ============ Main Component ============
export default function CustomFieldsSettingsPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editingField, setEditingField] = useState<FieldDefinitionResponse | null>(null)
  const [deletingField, setDeletingField] = useState<FieldDefinitionResponse | null>(null)

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Fetch field definitions
  const { data: fields = [], isLoading, error } = useQuery({
    queryKey: ["custom-field-definitions"],
    queryFn: fetchFieldDefinitions,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createFieldDefinition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-field-definitions"] })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateFieldDefinitionRequest> }) =>
      updateFieldDefinition(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-field-definitions"] })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteFieldDefinition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-field-definitions"] })
      toast.success("Field deleted")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: reorderFieldDefinitions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-field-definitions"] })
    },
  })

  const handleOpenCreate = useCallback(() => {
    setEditingField(null)
    setFormOpen(true)
  }, [])

  const handleEdit = useCallback((field: FieldDefinitionResponse) => {
    setEditingField(field)
    setFormOpen(true)
  }, [])

  const handleDelete = useCallback((field: FieldDefinitionResponse) => {
    setDeletingField(field)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (deletingField) {
      deleteMutation.mutate(deletingField.id)
      setDeletingField(null)
    }
  }, [deletingField, deleteMutation])

  const handleSubmit = useCallback(
    async (data: CreateFieldDefinitionRequest) => {
      if (editingField) {
        await updateMutation.mutateAsync({ id: editingField.id, data })
      } else {
        await createMutation.mutateAsync(data)
      }
    },
    [editingField, createMutation, updateMutation]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = fields.findIndex((f) => f.id === active.id)
      const newIndex = fields.findIndex((f) => f.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(fields, oldIndex, newIndex)
        const ids = reordered.map((f) => f.id)
        reorderMutation.mutate(ids)
      }
    },
    [fields, reorderMutation]
  )

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Custom Fields
          </h1>
          <p className="text-muted-foreground">
            Define custom fields for your tasks
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Field Definitions</CardTitle>
          <CardDescription>
            Drag to reorder. Fields will appear in this order on task forms.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              Failed to load field definitions
            </div>
          ) : fields.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No custom fields defined yet.</p>
              <p className="text-sm mt-1">
                Click &quot;Add Field&quot; to create your first custom field.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={fields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {fields.map((field) => (
                    <SortableFieldCard
                      key={field.id}
                      field={field}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <FieldDefinitionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        field={editingField}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation */}
      <ClientAlertDialog
        open={!!deletingField}
        onOpenChange={(open) => !open && setDeletingField(null)}
      >
        <ClientAlertDialogContent>
          <ClientAlertDialogHeader>
            <ClientAlertDialogTitle>Delete Custom Field</ClientAlertDialogTitle>
            <ClientAlertDialogDescription>
              Are you sure you want to delete the field &quot;{deletingField?.name}&quot;?
              This will remove the field and all its values from existing tasks.
              This action cannot be undone.
            </ClientAlertDialogDescription>
          </ClientAlertDialogHeader>
          <ClientAlertDialogFooter>
            <ClientAlertDialogCancel>Cancel</ClientAlertDialogCancel>
            <ClientAlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </ClientAlertDialogAction>
          </ClientAlertDialogFooter>
        </ClientAlertDialogContent>
      </ClientAlertDialog>
    </div>
  )
}
