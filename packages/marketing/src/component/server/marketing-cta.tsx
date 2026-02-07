import Link from "next/link";

import { Button, Card, CardContent } from "@afenda/shadcn";

import { marketingRoutes } from "../../lib/marketing.routes";

interface MarketingCtaProps {
  className?: string;
}

/**
 * Marketing domain CTA (Call to Action) section component.
 * Server component for conversion-focused section.
 * Follows shadcn best practices with proper composition.
 */
export function MarketingCta({ className }: MarketingCtaProps) {
  return (
    <section className={className}>
      <div className="container py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <Card className="border-2 bg-linear-to-br from-background to-muted/20">
          <CardContent className="flex flex-col items-center gap-6 p-8 text-center md:p-12">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Ready to Transform Your Workflow?
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Join organizations leveraging AFENDA for enterprise workflow
                orchestration with uncompromising security and compliance.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg" className="min-w-[180px]">
                <Link href={marketingRoutes.external.auth.register()}>
                  Start Free Trial
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="min-w-[180px]"
              >
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              No credit card required · Enterprise support available
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
