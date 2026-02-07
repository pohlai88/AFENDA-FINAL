/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Inbox view - shows documents with inbox status
 */

import { DocumentHub } from "@afenda/magicdrive/component/client";
import { UploadDialog } from "../_components";

export default function MagicDriveInboxPage() {
  return (
    <>
      <DocumentHub />
      <UploadDialog />
    </>
  )
}
