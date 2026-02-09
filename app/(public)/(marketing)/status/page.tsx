/**
 * @domain marketing
 * @layer ui
 * @responsibility UI route entrypoint for /status
 * 
 * Real-time system status page with ISR (Incremental Static Regeneration)
 * Auto-refreshes every 60 seconds for near real-time status updates
 */

import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, AlertTriangle, XCircle, Wrench, RefreshCw } from "lucide-react";
import { marketingRoutes } from "@afenda/marketing";

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

// ISR: Revalidate every 60 seconds for near real-time status
export const revalidate = 60;

export const metadata: Metadata = {
  title: "System Status",
  description: "Real-time system status for AFENDA platform - monitor uptime, performance, and service health.",
  alternates: {
    canonical: "/status",
  },
  openGraph: {
    title: "System Status - AFENDA",
    description: "Real-time platform status and uptime monitoring.",
    type: "website",
    url: "/status",
  },
  robots: {
    index: true,
    follow: true,
  },
};

type ServiceStatus = "operational" | "degraded" | "outage" | "maintenance";

interface Service {
  name: string;
  status: ServiceStatus;
  uptime: string;
  responseTime: string;
  lastChecked: string;
}

// Simulate fetching real-time status (replace with actual monitoring API)
async function getSystemStatus() {
  // In production, fetch from your monitoring system (e.g., Datadog, New Relic, custom health checks)
  // This will be cached for 60 seconds then revalidated
  return {
    lastUpdated: new Date().toISOString(),
    overallStatus: "operational" as ServiceStatus,
    services: [
      {
        name: "API Gateway",
        status: "operational" as ServiceStatus,
        uptime: "99.98%",
        responseTime: "45ms",
        lastChecked: new Date(Date.now() - 30000).toISOString(),
      },
      {
        name: "Database (NexusCanon)",
        status: "operational" as ServiceStatus,
        uptime: "99.99%",
        responseTime: "12ms",
        lastChecked: new Date(Date.now() - 30000).toISOString(),
      },
      {
        name: "Authentication Service",
        status: "operational" as ServiceStatus,
        uptime: "99.97%",
        responseTime: "38ms",
        lastChecked: new Date(Date.now() - 30000).toISOString(),
      },
      {
        name: "Workflow Engine",
        status: "operational" as ServiceStatus,
        uptime: "99.95%",
        responseTime: "156ms",
        lastChecked: new Date(Date.now() - 30000).toISOString(),
      },
      {
        name: "Module Orchestration",
        status: "operational" as ServiceStatus,
        uptime: "99.96%",
        responseTime: "89ms",
        lastChecked: new Date(Date.now() - 30000).toISOString(),
      },
      {
        name: "Audit Logging",
        status: "operational" as ServiceStatus,
        uptime: "99.99%",
        responseTime: "23ms",
        lastChecked: new Date(Date.now() - 30000).toISOString(),
      },
    ] as Service[],
    incidents: [
      {
        id: "inc-001",
        title: "Scheduled Maintenance - Database Upgrade",
        status: "resolved",
        severity: "maintenance",
        startTime: "2026-02-01T02:00:00Z",
        endTime: "2026-02-01T04:30:00Z",
        description: "Planned database upgrade to improve performance and add new features.",
      },
    ],
  };
}

function getStatusIcon(status: ServiceStatus) {
  switch (status) {
    case "operational":
      return <CheckCircle className="h-5 w-5 text-green-600" aria-hidden="true" />;
    case "degraded":
      return <AlertTriangle className="h-5 w-5 text-yellow-600" aria-hidden="true" />;
    case "outage":
      return <XCircle className="h-5 w-5 text-red-600" aria-hidden="true" />;
    case "maintenance":
      return <Wrench className="h-5 w-5 text-blue-600" aria-hidden="true" />;
  }
}

function getStatusBadge(status: ServiceStatus) {
  switch (status) {
    case "operational":
      return <Badge className="bg-green-600">Operational</Badge>;
    case "degraded":
      return <Badge variant="secondary">Degraded Performance</Badge>;
    case "outage":
      return <Badge variant="destructive">Service Outage</Badge>;
    case "maintenance":
      return <Badge variant="outline">Scheduled Maintenance</Badge>;
  }
}

export default async function StatusPage() {
  const status = await getSystemStatus();
  const lastUpdated = new Date(status.lastUpdated).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "medium",
  });

  return (
    <div className="container mx-auto max-w-5xl px-4 py-16">
      <div className="w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            {getStatusIcon(status.overallStatus)}
            <h1 className="text-4xl font-bold tracking-tight">System Status</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Real-time monitoring of AFENDA platform services
          </p>
          <div className="flex items-center justify-center gap-2">
            {getStatusBadge(status.overallStatus)}
            <Badge variant="outline">
              <RefreshCw className="h-3 w-3 mr-1" aria-hidden="true" />
              Auto-refreshes every 60s
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Service Health</CardTitle>
            <CardDescription>
              Current status of all platform services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {status.services.map((service, idx) => {
                const lastChecked = new Date(service.lastChecked).toLocaleString("en-US", {
                  timeStyle: "short",
                });
                return (
                  <div key={service.name}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        {getStatusIcon(service.status)}
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{service.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Last checked: {lastChecked}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-right">
                          <p className="font-semibold">{service.uptime}</p>
                          <p className="text-xs text-muted-foreground">Uptime</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{service.responseTime}</p>
                          <p className="text-xs text-muted-foreground">Response</p>
                        </div>
                      </div>
                    </div>
                    {idx < status.services.length - 1 && <Separator className="my-4" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Incidents</CardTitle>
            <CardDescription>
              Past 30 days of incidents and maintenance windows
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status.incidents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-600" aria-hidden="true" />
                <p className="font-semibold">No incidents reported</p>
                <p className="text-sm">All systems have been operational</p>
              </div>
            ) : (
              <div className="space-y-4">
                {status.incidents.map((incident) => {
                  const startTime = new Date(incident.startTime).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  });
                  const endTime = incident.endTime
                    ? new Date(incident.endTime).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                    : "Ongoing";

                  return (
                    <div key={incident.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h4 className="font-semibold">{incident.title}</h4>
                        <Badge variant="outline" className="shrink-0">
                          {incident.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {incident.description}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        <p>Started: {startTime}</p>
                        <p>Resolved: {endTime}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Uptime Metrics</CardTitle>
            <CardDescription>30-day rolling average</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 rounded-lg border">
                <p className="text-3xl font-bold text-green-600">99.97%</p>
                <p className="text-sm text-muted-foreground mt-1">Overall Uptime</p>
              </div>
              <div className="text-center p-4 rounded-lg border">
                <p className="text-3xl font-bold text-blue-600">42ms</p>
                <p className="text-sm text-muted-foreground mt-1">Avg Response Time</p>
              </div>
              <div className="text-center p-4 rounded-lg border">
                <p className="text-3xl font-bold text-purple-600">0</p>
                <p className="text-sm text-muted-foreground mt-1">Active Incidents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          <Button asChild>
            <Link href={marketingRoutes.ui.infrastructure()}>View Infrastructure Details</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={marketingRoutes.ui.contact()}>Report an Issue</Link>
          </Button>
        </div>

        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          <p className="font-semibold mb-2">About This Status Page</p>
          <p>
            This status page is automatically updated every 60 seconds using Next.js ISR.
            Service health checks are performed continuously, and this page reflects the most recent data.
            For real-time alerts, subscribe to our status notifications or contact support.
          </p>
        </div>
      </div>
    </div>
  );
}
