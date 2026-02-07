import Link from "next/link";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@afenda/shadcn";

import { marketingSiteConfig } from "../../lib/marketing.site-config";
import { marketingRoutes } from "../../lib/marketing.routes";
import { MarketingSiteLogo } from "../client/marketing-site-logo";

/**
 * Marketing domain homepage content component.
 * Server component for the / route.
 */
export function MarketingHomePage() {
  return (
    <main className="container mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-16">
      <header className="mb-8 flex items-center justify-between">
        <MarketingSiteLogo />
      </header>
      <section className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight">
          {marketingSiteConfig.name}
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          {marketingSiteConfig.description} This is the shell that will
          orchestrate modules, tenants, and workflows.
        </p>
      </section>

      <section className="flex flex-wrap gap-4">
        <Button asChild size="lg">
          <Link href={marketingRoutes.external.auth.login()}>Sign In</Link>
        </Button>
        <Button asChild size="lg">
          <Link href={marketingRoutes.external.auth.register()}>Create Account</Link>
        </Button>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Next step</CardTitle>
            <CardDescription>
              Build one vertical slice end-to-end (Approvals) and keep
              integrations as modules (iframe first).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={marketingRoutes.external.orchestra.root()}>Get Started</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>
              Multi-tenant architecture with module orchestration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Neon Auth integration</li>
              <li>• Row Level Security</li>
              <li>• Module-based architecture</li>
              <li>• Type-safe API contracts</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
