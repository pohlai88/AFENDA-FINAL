/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Search view - document search interface
 */

import type { Metadata } from "next"
import { DocumentHub } from "@afenda/magicdrive/component/client"
import { UploadDialog } from "../_components";

export const metadata: Metadata = {
  title: "Search",
  description: "Search documents and files across MagicDrive",
}

export default function MagicdriveSearchPage() {
  return (
    <>
      <DocumentHub />
      <UploadDialog />
    </>
  )
}
