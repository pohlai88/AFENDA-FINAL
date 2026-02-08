/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Audio view - filtered by audio file types
 */

import type { Metadata } from "next"
import { DocumentHub } from "@afenda/magicdrive/component/client"
import { UploadDialog } from "../_components"

export const metadata: Metadata = {
  title: "Audio",
  description: "Browse and manage audio files",
}

export default function MagicdriveAudioPage() {
  return (
    <>
      <DocumentHub />
      <UploadDialog />
    </>
  )
}
