/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Starred view - files marked as favorites
 */

import type { Metadata } from "next"
import { DocumentHub } from "@afenda/magicdrive/component/client"
import { UploadDialog } from "../_components"

export const metadata: Metadata = {
  title: "Starred",
  description: "Files marked as favorites for quick access",
}

export default function MagicdriveStarredPage() {
  return (
    <>
      <DocumentHub />
      <UploadDialog />
    </>
  )
}
