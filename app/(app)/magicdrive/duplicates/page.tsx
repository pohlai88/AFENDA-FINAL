/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Duplicates view - shows duplicate document groups
 */

import type { Metadata } from "next"
import { Suspense } from "react"
import { DuplicateGroupsView } from "@afenda/magicdrive/component/client"
import { UploadDialog } from "../_components";
import DuplicatesLoading from "./loading"

export const metadata: Metadata = {
  title: "Duplicates",
  description: "Manage duplicate document groups detected by content hash (SHA-256)",
}

export default function MagicdriveDuplicatesPage() {
  return (
    <>
      <Suspense fallback={<DuplicatesLoading />}>
        <DuplicateGroupsView />
      </Suspense>
      <UploadDialog />
    </>
  )
}
