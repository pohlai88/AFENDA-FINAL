/**
 * @domain magictodo
 * @layer ui
 * @responsibility Task detail page - view individual task
 */

import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { getAppBaseUrl } from "@afenda/shared/server"
import { routes } from "@afenda/shared/constants"
import { TaskDetailView } from "./_components/task-detail-view"

interface PageProps {
  params: Promise<{ id: string }>
}

async function getTask(id: string) {
  try {
    const baseUrl = await getAppBaseUrl()
    const url = `${baseUrl}${routes.api.magictodo.bff.taskById(id)}`
    const h = await headers()
    const cookie = h.get("cookie")
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
    })

    if (!response.ok) return null
    const data = await response.json()
    return data?.data ?? data
  } catch {
    return null
  }
}

export default async function TaskDetailPage({ params }: PageProps) {
  const { id } = await params
  const task = await getTask(id)

  if (!task) {
    notFound()
  }

  return <TaskDetailView task={task} />
}
