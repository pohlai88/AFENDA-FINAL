/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Images view - filtered by image file types
 */

import type { Metadata } from "next"
import { DocumentHub } from "@afenda/magicdrive/component/client"
import { UploadDialog } from "../_components"

export const metadata: Metadata = {
  title: "Images",
  description: "Browse and manage image files (JPEG, PNG, SVG, GIF, WebP)",
}

export default function MagicdriveImagesPage() {
  return (
    <>
      <DocumentHub />
      <UploadDialog />
    </>
  )
}
