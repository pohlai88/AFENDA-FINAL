/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Collections view - tagged document collections
 */

import type { Metadata } from "next"
import { DocumentHub } from "@afenda/magicdrive/component/client"
import { UploadDialog } from "../_components";

export const metadata: Metadata = {
  title: "Collections",
  description: "Browse and manage document collections",
}

export default function MagicdriveCollectionsPage() {
  return (
    <>
      <DocumentHub />
      <UploadDialog />
    </>
  )
}
