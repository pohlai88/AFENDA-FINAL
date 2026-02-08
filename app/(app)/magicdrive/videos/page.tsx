/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Videos view - filtered by video file types
 */

import type { Metadata } from "next"
import { DocumentHub } from "@afenda/magicdrive/component/client"
import { UploadDialog } from "../_components"

export const metadata: Metadata = {
  title: "Videos",
  description: "Browse and manage video files",
}

export default function MagicdriveVideosPage() {
  return (
    <>
      <DocumentHub />
      <UploadDialog />
    </>
  )
}
