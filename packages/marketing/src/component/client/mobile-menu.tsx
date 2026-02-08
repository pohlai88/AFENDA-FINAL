"use client";

import * as React from "react";
import Link from "next/link";
import { Button, ClientSheet, ClientSheetContent, ClientSheetTrigger } from "@afenda/shadcn";
import { useState } from "react";

import { marketingSiteConfig } from "../../lib/marketing.site-config";

/**
 * Mobile navigation menu component.
 * Client-only to avoid Radix UI hydration mismatch with aria-controls IDs.
 */
export function MobileMenu() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <ClientSheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <ClientSheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="sr-only">Toggle menu</span>
        </Button>
      </ClientSheetTrigger>
      <ClientSheetContent side="right" className="w-[300px] sm:w-[400px]">
        <nav className="flex flex-col gap-4 pt-6">
          {marketingSiteConfig.navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.title}
            </Link>
          ))}
          <div className="mt-4 flex flex-col gap-2">
            <Button variant="outline" asChild>
              <Link
                href={marketingSiteConfig.ctaLinks.signIn}
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            </Button>
            <Button asChild>
              <Link
                href={marketingSiteConfig.ctaLinks.getStarted}
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </Button>
          </div>
        </nav>
      </ClientSheetContent>
    </ClientSheet>
  );
}
