/**
 * MagicDrive segment layout. Secondary nav + children; no business logic.
 *
 * @layer route-ui
 */

import type { Metadata } from "next";
import { routes } from "@afenda/shared/constants";
import { MagicdriveNav } from "./_components";

export const metadata: Metadata = {
  title: {
    template: "%s | MagicDrive",
    default: "MagicDrive - Intelligent File Management",
  },
  description:
    "Intelligent file management with cloud storage, file sharing, and collaborative features. Organize, share, and collaborate on files with ease.",
  keywords: [
    "file management",
    "cloud storage",
    "file sharing",
    "collaboration",
    "documents",
    "media",
  ],
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "MagicDrive - Intelligent File Management",
    description:
      "Organize, share, and collaborate on files with intelligent file management",
    type: "website",
  },
  alternates: { canonical: routes.ui.magicdrive.root() },
};

interface MagicdriveLayoutProps {
  children: React.ReactNode;
}

export default function MagicdriveLayout({ children }: MagicdriveLayoutProps) {
  return (
    <div className="flex flex-col gap-6">
      <MagicdriveNav />
      {children}
    </div>
  );
}
