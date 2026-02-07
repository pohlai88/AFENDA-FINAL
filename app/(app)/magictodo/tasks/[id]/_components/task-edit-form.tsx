/**
 * @domain magictodo
 * @layer ui
 * @responsibility Task edit form - update task fields
 */

"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  useUpdateTaskMutation,
  TASK_STATUS,
  TASK_PRIORITY,
  type TaskResponse,
  type TaskStatus,
  type TaskPriority,
} from "@afenda/magictodo"
import { Button, Input, Card, CardContent, CardHeader, Spinner } from "@afenda/shadcn"
import { ClientSelect, ClientSelectContent, ClientSelectItem, ClientSelectTrigger, ClientSelectValue } from "@afenda/shadcn"
import { ArrowLeft } from "lucide-react"
import { routes } from "@afenda/shared/constants"

interface TaskEditFormProps {
  task: TaskResponse
}

export function TaskEditForm({ task }: TaskEditFormProps) {
  const router = useRouter()
  const updateMutation = useUpdateTaskMutation()

  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? "")
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [dueDate, setDueDate] = useState(
    task.dueDate ? task.dueDate.slice(0, 16) : ""
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!title.trim()) return

      try {
        await updateMutation.mutateAsync({
          id: task.id,
          data: {
            title: title.trim(),
            description: description.trim() || undefined,
            status,
            priority,
            dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          },
        })
        router.push(routes.ui.magictodo.taskDetail(task.id))
      } catch {
        // Error handled by mutation; UI can show toast if desired
      }
    },
    [
      title,
      description,
      status,
      priority,
      dueDate,
      task.id,
      updateMutation,
      router,
    ]
  )

  const isPending = updateMutation.isPending

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href={routes.ui.magictodo.taskDetail(task.id)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Task
        </Link>
      </Button>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <h1 className="text-xl font-semibold">Edit Task</h1>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={4}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isPending}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <ClientSelect
                  value={status}
                  onValueChange={(v) => setStatus(v as TaskStatus)}
                  disabled={isPending}
                >
                  <ClientSelectTrigger>
                    <ClientSelectValue placeholder="Status" />
                  </ClientSelectTrigger>
                  <ClientSelectContent>
                    <ClientSelectItem value={TASK_STATUS.TODO}>To do</ClientSelectItem>
                    <ClientSelectItem value={TASK_STATUS.IN_PROGRESS}>
                      In progress
                    </ClientSelectItem>
                    <ClientSelectItem value={TASK_STATUS.DONE}>Done</ClientSelectItem>
                    <ClientSelectItem value={TASK_STATUS.CANCELLED}>
                      Cancelled
                    </ClientSelectItem>
                  </ClientSelectContent>
                </ClientSelect>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <ClientSelect
                  value={priority}
                  onValueChange={(v) => setPriority(v as TaskPriority)}
                  disabled={isPending}
                >
                  <ClientSelectTrigger>
                    <ClientSelectValue placeholder="Priority" />
                  </ClientSelectTrigger>
                  <ClientSelectContent>
                    <ClientSelectItem value={TASK_PRIORITY.LOW}>Low</ClientSelectItem>
                    <ClientSelectItem value={TASK_PRIORITY.MEDIUM}>Medium</ClientSelectItem>
                    <ClientSelectItem value={TASK_PRIORITY.HIGH}>High</ClientSelectItem>
                    <ClientSelectItem value={TASK_PRIORITY.URGENT}>Urgent</ClientSelectItem>
                  </ClientSelectContent>
                </ClientSelect>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="dueDate" className="text-sm font-medium">
                Due date
              </label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending && <Spinner className="mr-2 h-4 w-4" />}
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  router.push(routes.ui.magictodo.taskDetail(task.id))
                }
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
