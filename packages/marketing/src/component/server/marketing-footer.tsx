import Link from "next/link";

import { Separator } from "@afenda/shadcn";

import { cn } from "../../lib/marketing.cn";
import { marketingSiteConfig } from "../../constant/marketing.site-config";
import { AfendaIcon } from "../client/afenda-icon";

interface FooterLinkGroupProps {
  title: string;
  links: readonly { title: string; href: string }[];
}

function FooterLinkGroup({ title, links }: FooterLinkGroupProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold leading-none">{title}</h4>
      <nav className="flex flex-col gap-3" aria-label={`${title} links`}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          >
            {link.title}
          </Link>
        ))}
      </nav>
    </div>
  );
}

/**
 * Marketing domain footer component.
 * Domain-owned per architecture rules.
 * Follows shadcn best practices with proper component composition.
 */
export function MarketingFooter({ className }: { className?: string }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "w-full border-t bg-background",
        className
      )}
      role="contentinfo"
    >
      <div className="container py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <div className="space-y-6 sm:col-span-2 xl:col-span-2">
            <div className="space-y-1">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xl font-bold transition-colors hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                aria-label="Home"
              >
                <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md">
                  <AfendaIcon className="size-5" />
                </div>
                {marketingSiteConfig.name}
              </Link>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                {marketingSiteConfig.tagline}
              </p>
            </div>
            <p className="text-xs text-muted-foreground/70 max-w-xs leading-relaxed">
              Protect · Detect · React · The Engine of Business Truth
            </p>
          </div>

          <FooterLinkGroup
            title="Product"
            links={marketingSiteConfig.footerLinks.product}
          />

          <FooterLinkGroup
            title="Company"
            links={marketingSiteConfig.footerLinks.company}
          />

          <FooterLinkGroup
            title="Legal"
            links={marketingSiteConfig.footerLinks.legal}
          />

          <FooterLinkGroup
            title="Resources"
            links={marketingSiteConfig.footerLinks.resources}
          />
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} {marketingSiteConfig.name}. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/70">
            MACHINA VITAE | NexusCanon
          </p>
        </div>
      </div>
    </footer>
  );
}
