/**
 * Public 404 Not Found
 * Displays when a public route is not found.
 * Provides helpful navigation for visitors.
 */

import Link from "next/link";
import { routes } from "@afenda/shared/constants";
import { Button } from "@afenda/shadcn";
import { Home, FileQuestion, Shield, FileText } from "lucide-react";

export default function PublicNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <div className="max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <FileQuestion className="h-24 w-24 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
          <h2 className="text-2xl font-semibold">Page not found</h2>
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button asChild size="lg">
            <Link href={routes.ui.marketing.home()}>
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={routes.ui.orchestra.dashboard()}>Go to Dashboard</Link>
          </Button>
        </div>
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-3">Helpful Links:</p>
          <div className="flex flex-col gap-2 text-sm">
            <Link href={routes.ui.marketing.privacy()} className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
              <Shield className="h-4 w-4" />
              Privacy Policy
            </Link>
            <Link href={routes.ui.marketing.security()} className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
              <Shield className="h-4 w-4" />
              Security Declaration
            </Link>
            <Link href={routes.ui.marketing.terms()} className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
              <FileText className="h-4 w-4" />
              Terms of Service
            </Link>
            <Link href={routes.ui.marketing.pdpa()} className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
              <FileText className="h-4 w-4" />
              PDPA Compliance
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
