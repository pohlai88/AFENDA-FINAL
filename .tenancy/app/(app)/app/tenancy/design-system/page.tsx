/**
 * @domain tenancy
 * @layer ui
 * @responsibility UI route entrypoint for /app/tenancy/design-system
 */

import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@afenda/shadcn"
import { Button } from "@afenda/shadcn"
import { routes } from "@afenda/shared/constants"

export default function TenancyDesignSystemPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Tenant Design System</h1>
        <p className="text-muted-foreground">
          Tenant-scoped theming and design tokens.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            This page is reserved for tenancy-owned design system configuration. For now, use the settings design-system page.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={routes.ui.settings.designSystem()}>
              Open settings design system
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={routes.ui.tenancy.root()}>
              Back to tenancy
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

