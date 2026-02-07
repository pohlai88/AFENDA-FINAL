/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Collections view - tagged document collections
 */

import { DocumentHub } from "@afenda/magicdrive/component/client"
import { UploadDialog } from "../_components";

export default function MagicFolderCollectionsPage() {
  return (
    <>
      <DocumentHub />
      <UploadDialog />
    </>
  )
}
