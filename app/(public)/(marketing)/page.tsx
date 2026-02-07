/**
 * @domain marketing
 * @layer ui
 * @responsibility UI route entrypoint for /
 */

import type { Metadata } from "next";

import {
  MarketingHero,
  MarketingFeatures,
  MarketingCta,
} from "@afenda/marketing"

// Static generation with ISR (revalidate every 24 hours)
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Home",
  description: "Enterprise workflow orchestration platform powered by NexusCanon Infrastructure Fabric with multi-tenant architecture and module-based design.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.nexuscanon.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AFENDA - Enterprise Workflow Platform",
    description: "Multi-tenant workflow orchestration powered by NexusCanon with RLS, RBAC, and type-safe API contracts.",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "AFENDA - Enterprise Workflow Platform",
    description: "Multi-tenant workflow orchestration powered by NexusCanon with RLS, RBAC, and type-safe API contracts.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function HomePage() {
  return (
    <main>
      <MarketingHero />
      <MarketingFeatures className="bg-muted/30" />
      <MarketingCta />
    </main>
  );
}

