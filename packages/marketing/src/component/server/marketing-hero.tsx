import Link from "next/link";

import { Button, Badge } from "@afenda/shadcn";

import { marketingSiteConfig } from "../../constant/marketing.site-config";
import { marketingRoutes } from "../../constant/marketing.routes";

interface MarketingHeroProps {
  className?: string;
}

/**
 * Marketing domain hero section component.
 * Server component for homepage hero.
 * Follows shadcn best practices with proper composition and layout.
 */
export function MarketingHero({ className }: MarketingHeroProps) {
  return (
    <section className={className}>
      <div className="container flex flex-col items-center gap-8 py-16 md:py-24 lg:py-32 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <Badge variant="outline" className="px-4 py-1.5">
            <span className="text-xs font-medium">
              Powered by NexusCanon Infrastructure Fabric
            </span>
          </Badge>

          <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            {marketingSiteConfig.name}
          </h1>

          <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl md:text-2xl">
            {marketingSiteConfig.description}
          </p>

          <p className="max-w-xl text-sm text-muted-foreground/80 md:text-base">
            Protect · Detect · React · The Engine of Business Truth
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:gap-4">
          <Button asChild size="lg" className="min-w-[160px]">
            <Link href={marketingRoutes.external.auth.register()}>
              Get Started
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="min-w-[160px]">
            <Link href={marketingRoutes.external.auth.login()}>
              Sign In
            </Link>
          </Button>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-green-500" />
            <span>Multi-tenant Architecture</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-blue-500" />
            <span>Row Level Security</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-purple-500" />
            <span>PDPA Compliant</span>
          </div>
        </div>
      </div>
    </section>
  );
}
