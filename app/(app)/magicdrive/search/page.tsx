/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Search view - document search interface
 */

import { DocumentHub } from "@afenda/magicdrive/component/client"
import { UploadDialog } from "../_components";

export default function MagicFolderSearchPage() {
  return (
    <>
      <DocumentHub />
      <UploadDialog />
    </>
  )
}
