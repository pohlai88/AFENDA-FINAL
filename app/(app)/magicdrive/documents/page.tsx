/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Documents view - filtered by document file types
 */

import type { Metadata } from "next"
import { DocumentHub } from "@afenda/magicdrive/component/client"
import { UploadDialog } from "../_components"

export const metadata: Metadata = {
  title: "Documents",
  description: "Browse and manage document files (PDF, Word, Excel, PowerPoint)",
}

export default function MagicdriveDocumentsPage() {
  return (
    <>
      <DocumentHub />
      <UploadDialog />
    </>
  )
}
