/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Trash view - soft-deleted files (30-day retention)
 */

import type { Metadata } from "next"
import { DocumentHub } from "@afenda/magicdrive/component/client"
import { UploadDialog } from "../_components"

export const metadata: Metadata = {
  title: "Trash",
  description: "Deleted files kept for 30 days before permanent removal",
}

export default function MagicdriveTrashPage() {
  return (
    <>
      <DocumentHub />
      <UploadDialog />
    </>
  )
}
