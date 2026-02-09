import type { ReactNode } from "react";
import type { Metadata } from "next"

import {
  marketingSiteConfig,
  MarketingHeader,
  MarketingFooter,
} from "@afenda/marketing"

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.nexuscanon.com"),
  title: {
    default: marketingSiteConfig.name,
    template: `%s | ${marketingSiteConfig.name}`,
  },
  description: marketingSiteConfig.description,
  keywords: [
    "AFENDA",
    "NexusCanon",
    "workflow orchestration",
    "enterprise platform",
    "multi-tenant",
    "PostgreSQL",
    "serverless",
    "Malaysia PDPA",
    "GDPR compliant",
    "SOC 2",
    "HIPAA",
  ],
  authors: [{ name: "NexusCanon", url: "https://www.nexuscanon.com" }],
  creator: "NexusCanon",
  publisher: "NexusCanon",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: marketingSiteConfig.name,
    title: marketingSiteConfig.name,
    description: marketingSiteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: marketingSiteConfig.name,
    description: marketingSiteConfig.description,
    creator: "@nexuscanon",
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
  alternates: {
    canonical: "/",
  },
}

export default function PublicLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  )
}

