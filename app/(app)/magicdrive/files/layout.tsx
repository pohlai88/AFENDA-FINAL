/**
 * @domain magicdrive
 * @layer ui
 * @responsibility Files segment metadata
 */

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Files",
  description: "Browse and manage all your files and folders",
}

export default function FilesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
