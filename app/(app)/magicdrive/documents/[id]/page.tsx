/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Document detail page - view and manage individual documents
 */

import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { DocumentPreview } from "@afenda/magicdrive/component/client"
import { getAppBaseUrl } from "@afenda/shared/server"
import { routes } from "@afenda/shared/constants"

interface PageProps {
  params: Promise<{ id: string }>
}

/** Document shape expected by DocumentPreview */
type DocumentForPreview = {
  id: string
  title: string | null
  docType: string
  status: string
  createdAt: string
  tags?: { id: string; name: string; slug: string }[]
  version?: { id: string; mimeType: string; sizeBytes: number; sha256: string }
  preview?: { thumbnail?: string; extracted?: string }
  aiClassifications?: { confidence: number; suggestedTags: string[]; duplicateGroupId?: string }
}

async function getDocument(id: string): Promise<DocumentForPreview | null> {
  try {
    const baseUrl = await getAppBaseUrl()
    const url = `${baseUrl}${routes.api.magicdrive.v1.objects.byId(id)}`
    const h = await headers()
    const cookie = h.get("cookie")
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
    })

    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as { data?: DocumentForPreview }
    const doc = data?.data ?? null
    if (!doc || typeof doc !== "object" || !("id" in doc) || !("docType" in doc)) {
      return null
    }
    return doc as DocumentForPreview
  } catch {
    return null
  }
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const { id } = await params
  const document = await getDocument(id)

  if (!document) {
    notFound()
  }

  return (
    <div className="h-full">
      <DocumentPreview document={document} />
    </div>
  )
}
