/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Unsorted view - documents without classification
 */

import type { Metadata } from "next"
import { DocumentHub } from "@afenda/magicdrive/component/client"
import { UploadDialog } from "../_components";

export const metadata: Metadata = {
  title: "Unsorted",
  description: "Documents without classification",
}

export default function MagicdriveUnsortedPage() {
  return (
    <>
      <DocumentHub />
      <UploadDialog />
    </>
  )
}
