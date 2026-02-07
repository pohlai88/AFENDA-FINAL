/**
 * App 404 Not Found
 * Displays when a route is not found within authenticated app.
 * Provides navigation to dashboard and common app sections.
 */

import Link from "next/link";
import { routes } from "@afenda/shared/constants";
import { Button } from "@afenda/shadcn";
import { FileQuestion, Home, LayoutDashboard, Settings } from "lucide-react";

export default function AppNotFound() {
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
                        The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to access it.
                    </p>
                </div>
                <div className="flex flex-col gap-2">
                    <Button asChild size="lg">
                        <Link href={routes.ui.orchestra.dashboard()}>
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Go to Dashboard
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                        <Link href={routes.ui.orchestra.root()}>
                            <Home className="mr-2 h-4 w-4" />
                            Go Home
                        </Link>
                    </Button>
                </div>
                <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-3">Quick Links:</p>
                    <div className="flex flex-col gap-2 text-sm">
                        <Link href={routes.ui.admin.health()} className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
                            <Settings className="h-4 w-4" />
                            System Health
                        </Link>
                        <Link href={routes.ui.admin.config()} className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
                            <Settings className="h-4 w-4" />
                            Configuration
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
