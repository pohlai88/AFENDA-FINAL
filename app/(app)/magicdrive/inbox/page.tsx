/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Inbox view - shows documents with inbox status
 */

import type { Metadata } from "next"
import { DocumentHub } from "@afenda/magicdrive/component/client";
import { UploadDialog } from "../_components";

export const metadata: Metadata = {
  title: "Inbox",
  description: "View and process incoming documents and files",
}

export default function MagicdriveInboxPage() {
  return (
    <>
      <DocumentHub />
      <UploadDialog />
    </>
  )
}
