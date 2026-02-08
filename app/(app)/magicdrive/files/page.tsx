/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Files view - browse all files and folders
 */

import { DocumentHub } from "@afenda/magicdrive/component/client"
import { UploadDialog } from "../_components"

export default function MagicdriveFilesPage() {
  return (
    <>
      <DocumentHub />
      <UploadDialog />
    </>
  )
}
