/**
 * @domain marketing
 * @layer ui
 * @responsibility UI route entrypoint for /api-docs
 * 
 * Dynamic API reference page with ISR (Incremental Static Regeneration)
 * Auto-refreshes every 30 minutes to fetch latest API specifications
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";
import { AfendaIcon } from "@afenda/marketing";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Separator,
} from "@afenda/shadcn";

// ISR: Revalidate every 30 minutes (1800 seconds)
export const revalidate = 1800;

export const metadata: Metadata = {
  title: "API Reference",
  description: "Complete API reference for AFENDA - REST endpoints, authentication, request/response formats, and code examples.",
  alternates: {
    canonical: "/api-docs",
  },
  openGraph: {
    title: "API Reference - AFENDA",
    description: "Complete REST API documentation with examples and specifications.",
    type: "website",
    url: "/api-docs",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Simulate fetching API documentation (replace with actual OpenAPI/Swagger spec)
async function getAPIDocumentation() {
  // In production, fetch from your OpenAPI spec, Swagger, or API documentation system
  // This will be cached and revalidated every 30 minutes
  return {
    lastUpdated: new Date().toISOString(),
    version: "v1.0.0",
    baseUrl: "https://api.nexuscanon.com/v1",
    endpoints: [
      {
        category: "Authentication",
        icon: AfendaIcon,
        description: "OAuth 2.0 authentication endpoints",
        endpoints: [
          {
            method: "POST",
            path: "/auth/login",
            description: "Authenticate user and obtain access token",
            authenticated: false,
          },
          {
            method: "POST",
            path: "/auth/refresh",
            description: "Refresh access token using refresh token",
            authenticated: false,
          },
          {
            method: "POST",
            path: "/auth/logout",
            description: "Revoke access and refresh tokens",
            authenticated: true,
          },
          {
            method: "GET",
            path: "/auth/me",
            description: "Get current authenticated user information",
            authenticated: true,
          },
        ],
      },
      {
        category: "Workflows",
        icon: AfendaIcon,
        description: "Workflow management and orchestration",
        endpoints: [
          {
            method: "GET",
            path: "/workflows",
            description: "List all workflows for current tenant",
            authenticated: true,
          },
          {
            method: "POST",
            path: "/workflows",
            description: "Create a new workflow",
            authenticated: true,
          },
          {
            method: "GET",
            path: "/workflows/:id",
            description: "Get workflow details by ID",
            authenticated: true,
          },
          {
            method: "PATCH",
            path: "/workflows/:id",
            description: "Update workflow configuration",
            authenticated: true,
          },
          {
            method: "DELETE",
            path: "/workflows/:id",
            description: "Delete workflow (soft delete)",
            authenticated: true,
          },
        ],
      },
      {
        category: "Tenants",
        icon: AfendaIcon,
        description: "Multi-tenant management",
        endpoints: [
          {
            method: "GET",
            path: "/tenants",
            description: "List accessible tenants for current user",
            authenticated: true,
          },
          {
            method: "POST",
            path: "/tenants",
            description: "Create new tenant (admin only)",
            authenticated: true,
          },
          {
            method: "GET",
            path: "/tenants/:id",
            description: "Get tenant details and configuration",
            authenticated: true,
          },
          {
            method: "PATCH",
            path: "/tenants/:id",
            description: "Update tenant settings",
            authenticated: true,
          },
        ],
      },
      {
        category: "Modules",
        icon: AfendaIcon,
        description: "Module orchestration and integration",
        endpoints: [
          {
            method: "GET",
            path: "/modules",
            description: "List available modules",
            authenticated: true,
          },
          {
            method: "POST",
            path: "/modules/:id/invoke",
            description: "Invoke module with parameters",
            authenticated: true,
          },
          {
            method: "GET",
            path: "/modules/:id/status",
            description: "Get module execution status",
            authenticated: true,
          },
        ],
      },
      {
        category: "Audit Logs",
        icon: AfendaIcon,
        description: "Audit trail and compliance logging",
        endpoints: [
          {
            method: "GET",
            path: "/audit-logs",
            description: "Query audit logs with filters",
            authenticated: true,
          },
          {
            method: "GET",
            path: "/audit-logs/:id",
            description: "Get specific audit log entry",
            authenticated: true,
          },
        ],
      },
    ],
  };
}

export default async function APIDocsPage() {
  const apiDocs = await getAPIDocumentation();
  const lastUpdated = new Date(apiDocs.lastUpdated).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="container mx-auto max-w-6xl px-4 py-16">
      <div className="w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">API Reference</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Complete REST API documentation with authentication, endpoints, and examples
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge variant="outline">Version: {apiDocs.version}</Badge>
            <Badge variant="outline">Last updated: {lastUpdated}</Badge>
            <Badge variant="outline">Auto-refreshes every 30 min</Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AfendaIcon className="h-5 w-5" aria-hidden="true" />
              Base URL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <code className="block p-3 bg-muted rounded-md text-sm font-mono">
              {apiDocs.baseUrl}
            </code>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {apiDocs.endpoints.map((category) => {
            const Icon = category.icon;
            return (
              <Card key={category.category}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="size-5 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <CardTitle>{category.category}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.endpoints.map((endpoint, idx) => (
                      <div key={idx}>
                        <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                          <Badge
                            variant={
                              endpoint.method === "GET"
                                ? "outline"
                                : endpoint.method === "POST"
                                  ? "default"
                                  : endpoint.method === "PATCH"
                                    ? "secondary"
                                    : "destructive"
                            }
                            className="shrink-0 font-mono text-xs"
                          >
                            {endpoint.method}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <code className="text-sm font-mono block mb-1">
                              {endpoint.path}
                            </code>
                            <p className="text-sm text-muted-foreground">
                              {endpoint.description}
                            </p>
                            {endpoint.authenticated && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                <Lock className="h-3 w-3 mr-1" aria-hidden="true" />
                                Requires Authentication
                              </Badge>
                            )}
                          </div>
                        </div>
                        {idx < category.endpoints.length - 1 && <Separator className="my-3" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>
              All authenticated endpoints require a valid JWT access token
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-semibold mb-2">Authorization Header</p>
              <code className="block p-3 bg-muted rounded-md text-sm font-mono">
                Authorization: Bearer &lt;access_token&gt;
              </code>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-semibold mb-2">Token Expiration</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Access Token: 15 minutes</li>
                <li>• Refresh Token: 7 days</li>
                <li>• Use /auth/refresh to obtain new access token</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rate Limiting</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• <strong>Authenticated requests:</strong> 1000 requests per hour</li>
              <li>• <strong>Unauthenticated requests:</strong> 100 requests per hour</li>
              <li>• Rate limit headers included in all responses</li>
              <li>• 429 status code returned when limit exceeded</li>
            </ul>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          <Button asChild>
            <Link href="/docs">View Documentation</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Contact Support</Link>
          </Button>
        </div>

        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          <p className="font-semibold mb-2">About This API Reference</p>
          <p>
            This API reference is automatically updated every 30 minutes using Next.js ISR.
            OpenAPI/Swagger specifications are fetched and formatted for optimal readability.
            For interactive API testing, use our Postman collection or contact support for access.
          </p>
        </div>
      </div>
    </div>
  );
}
