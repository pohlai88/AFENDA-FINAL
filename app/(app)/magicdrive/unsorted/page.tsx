/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Unsorted view - documents without classification
 */

import { DocumentHub } from "@afenda/magicdrive/component/client"
import { UploadDialog } from "../_components";

export default function MagicFolderUnsortedPage() {
  return (
    <>
      <DocumentHub />
      <UploadDialog />
    </>
  )
}
