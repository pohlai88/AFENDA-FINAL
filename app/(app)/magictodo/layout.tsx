/**
 * MagicTodo segment layout. Secondary nav + children; no business logic.
 *
 * @layer route-ui
 */

import type { Metadata } from "next";
import { routes } from "@afenda/shared/constants";
import { MagictodoNav } from "./_components";

export const metadata: Metadata = {
  title: {
    template: "%s | MagicTodo",
    default: "MagicTodo - Intelligent Task Management",
  },
  description:
    "Intelligent task management with multiple views, focus mode, and team collaboration. Organize tasks with Kanban, Calendar, Gantt, and more.",
  keywords: [
    "task management",
    "productivity",
    "kanban",
    "calendar",
    "gantt",
    "focus mode",
    "team collaboration",
  ],
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "MagicTodo - Intelligent Task Management",
    description:
      "Organize tasks with multiple views, focus mode, and team collaboration",
    type: "website",
  },
  alternates: { canonical: routes.ui.magictodo.root() },
};

interface MagictodoLayoutProps {
  children: React.ReactNode;
}

export default function MagictodoLayout({ children }: MagictodoLayoutProps) {
  return (
    <div className="flex flex-col gap-6">
      <MagictodoNav />
      {children}
    </div>
  );
}
