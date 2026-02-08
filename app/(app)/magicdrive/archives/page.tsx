/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Archives view - filtered by archive file types (ZIP, RAR, 7z)
 */

import type { Metadata } from "next"
import { DocumentHub } from "@afenda/magicdrive/component/client"
import { UploadDialog } from "../_components"

export const metadata: Metadata = {
  title: "Archives",
  description: "Browse and manage archive files (ZIP, RAR, 7z)",
}

export default function MagicdriveArchivesPage() {
  return (
    <>
      <DocumentHub />
      <UploadDialog />
    </>
  )
}
