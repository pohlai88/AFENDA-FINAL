"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

import { Button, Separator, AnimatedThemeToggler } from "@afenda/shadcn";

import { cn } from "../../lib/marketing.cn";
import { marketingSiteConfig } from "../../constant/marketing.site-config";
import { MarketingSiteLogo } from "./marketing-site-logo";

const MobileMenu = dynamic(() => import("./mobile-menu").then((m) => m.MobileMenu), {
  ssr: false,
});

/**
 * Marketing domain header component.
 * Includes navigation, CTA buttons, and theme toggle.
 * Domain-owned per architecture rules.
 * Follows shadcn best practices with proper accessibility and focus management.
 */
export function MarketingHeader({ className }: { className?: string }) {

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
      role="banner"
    >
      <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <MarketingSiteLogo className="mr-6 shrink-0" />

        <nav
          className="hidden md:flex md:flex-1 md:items-center md:gap-1"
          aria-label="Main navigation"
        >
          {marketingSiteConfig.navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
              title={link.description}
            >
              {link.title}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex md:items-center md:gap-2">
          <AnimatedThemeToggler className="rounded-md" />
          <Separator orientation="vertical" className="h-6" />
          <Button variant="ghost" asChild className="rounded-md">
            <Link href={marketingSiteConfig.ctaLinks.signIn}>Sign In</Link>
          </Button>
          <Button asChild className="rounded-md">
            <Link href={marketingSiteConfig.ctaLinks.getStarted}>
              Get Started
            </Link>
          </Button>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2 md:hidden">
          <AnimatedThemeToggler className="rounded-md" />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
