/**
 * @domain magictodo
 * @layer ui
 * @responsibility Client wrapper for task detail - navigation and actions
 */

"use client"

import Link from "next/link"
import { MagictodoTaskCard, useMagictodoNavigation, type TaskResponse } from "@afenda/magictodo"
import { Button } from "@afenda/shadcn"
import { ArrowLeft, Pencil } from "lucide-react"
import { routes } from "@afenda/shared/constants"

interface TaskDetailViewProps {
  task: TaskResponse
}

export function TaskDetailView({ task }: TaskDetailViewProps) {
  const { goToEdit } = useMagictodoNavigation()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={routes.ui.magictodo.tasks()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Link>
        </Button>
        <Button size="sm" onClick={() => goToEdit(task.id)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>
      <MagictodoTaskCard
        task={task}
        onEdit={() => goToEdit(task.id)}
      />
    </div>
  )
}
