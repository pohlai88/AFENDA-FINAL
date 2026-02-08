/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Recent view - recently accessed files
 */

import type { Metadata } from "next"
import { DocumentHub } from "@afenda/magicdrive/component/client"
import { UploadDialog } from "../_components"

export const metadata: Metadata = {
  title: "Recent",
  description: "Recently accessed files and documents",
}

export default function MagicdriveRecentPage() {
  return (
    <>
      <DocumentHub />
      <UploadDialog />
    </>
  )
}
