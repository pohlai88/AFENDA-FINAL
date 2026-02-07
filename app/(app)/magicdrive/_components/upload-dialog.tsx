/**
 * Upload dialog: integrates domain UploadZone with ClientDialog.
 * Open/close state from @afenda/magicdrive zustand store.
 *
 * @layer route-ui
 */

"use client";

import {
  ClientDialog,
  ClientDialogContent,
  ClientDialogHeader,
  ClientDialogTitle,
} from "@afenda/shadcn";
import { UploadZone } from "@afenda/magicdrive/component/client";
import { useUploadStore } from "@afenda/magicdrive/zustand";

export function UploadDialog() {
  const { showUploadDialog, toggleUploadDialog } = useUploadStore()

  return (
    <ClientDialog open={showUploadDialog} onOpenChange={toggleUploadDialog}>
      <ClientDialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <ClientDialogHeader>
          <ClientDialogTitle>Upload Documents</ClientDialogTitle>
        </ClientDialogHeader>
        <UploadZone />
      </ClientDialogContent>
    </ClientDialog>
  )
}
