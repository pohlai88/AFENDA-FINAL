/**
 * Configuration Templates Page
 * Steve Jobs-inspired template gallery.
 * 
 * @performance Client-side filtering and search for instant feedback
 * @ux Progressive enhancement with loading states
 */

import type { Metadata } from "next";
import { IconArrowLeft, IconSparkles } from "@tabler/icons-react";
import Link from "next/link";

import { Button } from "@afenda/shadcn";
import { routes } from "@afenda/shared/constants";

import { ConfigTemplateBrowserEnhanced } from "./_components/ConfigTemplateBrowserEnhanced";

export const metadata: Metadata = {
  title: "Configuration Templates | Admin",
  description: "Browse and apply enterprise-grade configuration templates with one click",
};

// Client-side rendering for interactive template browser
export const dynamic = "force-dynamic";

export default function ConfigTemplatesPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      {/* Clean Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <IconSparkles className="size-8 text-primary" />
            Templates
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure your system in seconds. Not hours.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={routes.ui.admin.config()}>
            <IconArrowLeft className="mr-2 size-4" />
            Back to Config
          </Link>
        </Button>
      </div>

      {/* Template Browser */}
      <ConfigTemplateBrowserEnhanced />
    </div>
  );
}
