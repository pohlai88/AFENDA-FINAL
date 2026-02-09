/**
 * Marketing domain site configuration.
 * Embedded per-domain to avoid cross-domain dependencies.
 *
 * Enterprise-grade configuration for AFENDA powered by NexusCanon Infrastructure Fabric.
 *
 * @domain marketing
 */

export type NavLink = {
  readonly title: string;
  readonly href: string;
  readonly description?: string;
};

export type SiteConfig = {
  readonly name: string;
  readonly description: string;
  readonly tagline: string;
  readonly appUrl: string;
  readonly supportEmail: string;
  readonly navLinks: readonly NavLink[];
  readonly ctaLinks: {
    readonly signIn: string;
    readonly getStarted: string;
  };
  readonly footerLinks: {
    readonly product: readonly NavLink[];
    readonly company: readonly NavLink[];
    readonly legal: readonly NavLink[];
    readonly resources: readonly NavLink[];
  };
  readonly social: {
    readonly twitter?: string;
    readonly github?: string;
    readonly linkedin?: string;
  };
};

export const marketingSiteConfig: SiteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "AFENDA",
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ??
    "Enterprise workflow orchestration platform powered by NexusCanon Infrastructure Fabric",
  tagline: "MACHINA VITAE | NexusCanon",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://www.nexuscanon.com",
  supportEmail: "legal@nexuscanon.com",
  navLinks: [
    { title: "Security", href: "/security", description: "Security & Compliance" },
    { title: "Infrastructure", href: "/infrastructure", description: "Technical Architecture" },
    { title: "PDPA", href: "/pdpa", description: "Malaysia PDPA Compliance" },
  ] as const,
  ctaLinks: {
    signIn: "/login",
    getStarted: "/register",
  },
  footerLinks: {
    product: [
      { title: "Infrastructure", href: "/infrastructure" },
      { title: "Security", href: "/security" },
    ] as const,
    company: [
      { title: "About", href: "/about" },
      { title: "Contact", href: "/contact" },
    ] as const,
    legal: [
      { title: "Privacy Policy", href: "/privacy" },
      { title: "Terms of Service", href: "/terms" },
      { title: "Security Declaration", href: "/security" },
      { title: "PDPA Compliance", href: "/pdpa" },
    ] as const,
    resources: [
      { title: "Documentation", href: "/docs" },
      { title: "API Reference", href: "/api-docs" },
      { title: "Status", href: "/status" },
    ] as const,
  },
  social: {
    twitter: process.env.NEXT_PUBLIC_TWITTER_URL,
    github: process.env.NEXT_PUBLIC_GITHUB_URL,
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL,
  },
} as const;
