import * as React from "react";
import type { Metadata } from "next"
import { Geist_Mono, Figtree, Inter } from "next/font/google"
import { headers } from "next/headers"
import "./globals.css"

import { ThemeProvider, TooltipProvider } from "@afenda/shadcn"
import { Toaster } from "@afenda/shadcn"
import { siteConfig } from "@afenda/shared/constants"
import {
  ClientRuntime,
  AuthProvider,
  QueryProvider,
  WebVitals,
} from "@/app/_components"

const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" })

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.appUrl),
  title: siteConfig.name,
  description: siteConfig.description,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AFENDA",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "AFENDA",
    title: siteConfig.name,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary",
    title: siteConfig.name,
    description: siteConfig.description,
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.appUrl,
    description: siteConfig.description,
  }

  return (
    <html lang="en" className={`${figtree.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className={`${geistMono.variable} bg-background text-foreground min-h-svh antialiased font-sans`}>
        <script
          type="application/ld+json"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <ThemeProvider>
          <TooltipProvider delayDuration={0}>
            <QueryProvider>
              <AuthProvider>
                <WebVitals />
                {children}
                <Toaster />
              </AuthProvider>
            </QueryProvider>
          </TooltipProvider>
        </ThemeProvider>
        <ClientRuntime />
      </body>
    </html>
  )
}
