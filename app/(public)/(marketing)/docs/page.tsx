/**
 * @domain marketing
 * @layer ui
 * @responsibility UI route entrypoint for /docs
 * 
 * Dynamic documentation page with ISR (Incremental Static Regeneration)
 * Auto-refreshes every 1 hour to fetch latest documentation
 */

import type { Metadata } from "next";
import Link from "next/link";
import { AfendaIcon } from "@afenda/marketing";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
} from "@afenda/shadcn";
import { marketingRoutes } from "@afenda/marketing";

// ISR: Revalidate every 1 hour (3600 seconds)
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Documentation",
  description: "Comprehensive documentation for AFENDA - guides, tutorials, and best practices for enterprise workflow orchestration.",
  alternates: {
    canonical: "/docs",
  },
  openGraph: {
    title: "Documentation - AFENDA",
    description: "Complete guides and tutorials for AFENDA platform.",
    type: "website",
    url: "/docs",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Simulate fetching documentation data (replace with actual API call)
async function getDocumentation() {
  // In production, fetch from your CMS, API, or documentation system
  // This will be cached and revalidated every hour
  return {
    lastUpdated: new Date().toISOString(),
    sections: [
      {
        id: "getting-started",
        title: "Getting Started",
        icon: AfendaIcon,
        description: "Quick start guides and initial setup",
        articles: [
          { title: "Introduction to AFENDA", href: "#intro", readTime: "5 min" },
          { title: "Account Setup & Configuration", href: "#setup", readTime: "10 min" },
          { title: "First Workflow Creation", href: "#first-workflow", readTime: "15 min" },
          { title: "Authentication & Authorization", href: "#auth", readTime: "12 min" },
        ],
      },
      {
        id: "architecture",
        title: "Architecture",
        icon: AfendaIcon,
        description: "System architecture and design patterns",
        articles: [
          { title: "Multi-Tenant Architecture", href: "#multi-tenant", readTime: "20 min" },
          { title: "Module Orchestration", href: "#modules", readTime: "15 min" },
          { title: "Database Schema & RLS", href: "#database", readTime: "25 min" },
          { title: "API Contract Design", href: "#api-contracts", readTime: "18 min" },
        ],
      },
      {
        id: "security",
        title: "Security & Compliance",
        icon: AfendaIcon,
        description: "Security best practices and compliance guides",
        articles: [
          { title: "Row-Level Security (RLS)", href: "#rls", readTime: "20 min" },
          { title: "RBAC Implementation", href: "#rbac", readTime: "15 min" },
          { title: "PDPA Compliance Guide", href: "#pdpa", readTime: "30 min" },
          { title: "Audit Logging", href: "#audit", readTime: "12 min" },
        ],
      },
      {
        id: "development",
        title: "Development",
        icon: AfendaIcon,
        description: "Development guides and API usage",
        articles: [
          { title: "Local Development Setup", href: "#dev-setup", readTime: "15 min" },
          { title: "TypeScript Best Practices", href: "#typescript", readTime: "20 min" },
          { title: "Testing Strategies", href: "#testing", readTime: "25 min" },
          { title: "Deployment Guide", href: "#deployment", readTime: "30 min" },
        ],
      },
      {
        id: "infrastructure",
        title: "Infrastructure",
        icon: AfendaIcon,
        description: "NexusCanon Infrastructure Fabric guides",
        articles: [
          { title: "Branching Strategies", href: "#branching", readTime: "15 min" },
          { title: "Elastic Compute Configuration", href: "#compute", readTime: "12 min" },
          { title: "Backup & Recovery", href: "#backup", readTime: "20 min" },
          { title: "Performance Optimization", href: "#performance", readTime: "25 min" },
        ],
      },
      {
        id: "reference",
        title: "Reference",
        icon: AfendaIcon,
        description: "Technical reference and specifications",
        articles: [
          { title: "Environment Variables", href: "#env-vars", readTime: "10 min" },
          { title: "Configuration Options", href: "#config", readTime: "15 min" },
          { title: "Error Codes Reference", href: "#errors", readTime: "12 min" },
          { title: "Glossary", href: "#glossary", readTime: "8 min" },
        ],
      },
    ],
  };
}

export default async function DocsPage() {
  const docs = await getDocumentation();
  const lastUpdated = new Date(docs.lastUpdated).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="container mx-auto max-w-6xl px-4 py-16">
      <div className="w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Documentation</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive guides, tutorials, and best practices for AFENDA platform
          </p>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline">
              Last updated: {lastUpdated}
            </Badge>
            <Badge variant="outline">
              Auto-refreshes hourly
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {docs.sections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="size-5 text-primary" aria-hidden="true" />
                    </div>
                  </div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2">
                    {section.articles.map((article) => (
                      <li key={article.href}>
                        <Link
                          href={article.href}
                          className="group flex items-start justify-between gap-2 text-sm hover:text-primary transition-colors"
                        >
                          <span className="group-hover:underline">{article.title}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {article.readTime}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AfendaIcon className="h-5 w-5" aria-hidden="true" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Cannot find what you are looking for? Check out these additional resources:
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="outline">
                <Link href={marketingRoutes.ui.apiDocs()}>API Reference</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={marketingRoutes.ui.contact()}>Contact Support</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href={marketingRoutes.external.orchestra.root()}>Go to AFENDA</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          <p className="font-semibold mb-2">About This Documentation</p>
          <p>
            This documentation is automatically updated every hour using Next.js Incremental Static Regeneration (ISR).
            Content is fetched from our documentation system and cached for optimal performance while ensuring freshness.
          </p>
        </div>
      </div>
    </div>
  );
}
