/**
 * Dashboard Metadata
 * SEO and Open Graph metadata for the dashboard page
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Afenda Enterprise Platform",
  description: "System overview, health monitoring, and quick administrative actions for Afenda Enterprise Platform",
  openGraph: {
    title: "Dashboard | Afenda Enterprise Platform",
    description: "Real-time system health monitoring and administrative dashboard",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dashboard | Afenda Enterprise Platform",
    description: "Real-time system health monitoring and administrative dashboard",
  },
  robots: {
    index: false, // Dashboard should not be indexed by search engines
    follow: false,
  },
};
