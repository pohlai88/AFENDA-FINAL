/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Shared view - files shared with teams and collaborators
 */

import type { Metadata } from "next"
import { DocumentHub } from "@afenda/magicdrive/component/client"
import { UploadDialog } from "../_components"

export const metadata: Metadata = {
  title: "Shared",
  description: "Files shared with your teams and collaborators",
}

export default function MagicdriveSharedPage() {
  return (
    <>
      <DocumentHub />
      <UploadDialog />
    </>
  )
}
