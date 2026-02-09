/**
 * @domain marketing
 * @layer ui
 * @responsibility UI route entrypoint for /infrastructure
 */

import type { Metadata } from "next"
import Link from "next/link"
import {
  GitBranch,
  Cpu,
  MinusCircle,
  RotateCcw,
  LayoutGrid,
  Activity,
  Shield,
  BookOpen,
} from "lucide-react"

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Separator,
} from "@afenda/shadcn"
import { marketingRoutes } from "@afenda/marketing"

// Static generation with ISR (revalidate monthly)
export const revalidate = 2592000;

export const metadata: Metadata = {
  title: "Infrastructure",
  description:
    "NexusCanon Infrastructure Fabric powering AFENDA — instant branching, elastic compute, point-in-time recovery, and operational resilience.",
  alternates: {
    canonical: "/infrastructure",
  },
  openGraph: {
    title: "Infrastructure - AFENDA",
    description: "NexusCanon Infrastructure Fabric: Branch-first safety, elastic 0.25-8 CU compute, 30-day PITR, 99.95% uptime, and 11-nines durability.",
    type: "website",
    url: "/infrastructure",
  },
  twitter: {
    card: "summary_large_image",
    title: "Infrastructure - AFENDA",
    description: "Enterprise infrastructure powered by NexusCanon with instant branching and elastic compute.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function InfrastructurePage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="w-full">
        <Card className="relative overflow-hidden">
          <CardHeader className="space-y-3 text-center relative z-10">
            <CardTitle className="text-3xl">NexusCanon Infrastructure Fabric</CardTitle>
            <CardDescription>
              Infrastructure foundations for AFENDA: branch-first environments, elastic compute, and point-in-time recovery
              designed for operational clarity, speed, and resilience.
            </CardDescription>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline" className="gap-1">
                <GitBranch className="h-3 w-3" aria-hidden="true" /> Branch-First
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Cpu className="h-3 w-3" aria-hidden="true" /> Elastic Compute
              </Badge>
              <Badge variant="outline" className="gap-1">
                <MinusCircle className="h-3 w-3" aria-hidden="true" /> Scale-to-Zero
              </Badge>
              <Badge variant="outline" className="gap-1">
                <RotateCcw className="h-3 w-3" aria-hidden="true" /> Resilient Recovery
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-10">
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4 text-sm">
                <h3 className="font-semibold">Branch-First Safety</h3>
                <p className="text-muted-foreground mt-2">
                  Instant, copy-on-write branches reduce risk by isolating experiments, releases, and recoveries.
                </p>
              </div>
              <div className="rounded-lg border p-4 text-sm">
                <h3 className="font-semibold">Elastic Performance</h3>
                <p className="text-muted-foreground mt-2">
                  Compute scales with demand and suspends when idle to balance performance and cost.
                </p>
              </div>
              <div className="rounded-lg border p-4 text-sm">
                <h3 className="font-semibold">Recovery Ready</h3>
                <p className="text-muted-foreground mt-2">
                  Point-in-time recovery and audited backup pipelines enable confident rollback and investigation.
                </p>
              </div>
            </section>
            {/* Core Infrastructure Primitives */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-indigo-600" aria-hidden="true" />
                <h3 className="text-lg font-semibold">Core Infrastructure Primitives</h3>
              </div>
              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-indigo-600" aria-hidden="true" /> Instant Branching
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>Copy-on-write clones for dev, preview, testing, and migrations with isolated compute endpoints.</p>
                    <ul className="list-inside list-disc space-y-1">
                      <li>Instant copy-on-write branches</li>
                      <li>Branch-per-PR preview environments</li>
                      <li>Isolated compute endpoints</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-indigo-600" aria-hidden="true" /> Elastic Compute
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>Compute scales between min/max CU based on CPU and memory pressure.</p>
                    <ul className="list-inside list-disc space-y-1">
                      <li>Min/max envelopes (0.25–2 CU)</li>
                      <li>Instant response to load spikes</li>
                      <li>No manual provisioning</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MinusCircle className="h-4 w-4 text-indigo-600" aria-hidden="true" /> Scale-to-Zero
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>Idle compute suspends automatically while storage remains durable and accessible.</p>
                    <ul className="list-inside list-disc space-y-1">
                      <li>Auto-suspend after 5 min idle</li>
                      <li>~500ms cold start on wake</li>
                      <li>Storage always accessible</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <RotateCcw className="h-4 w-4 text-indigo-600" aria-hidden="true" /> Point-in-Time Recovery
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>Restore to any point within a 7–30 day retention window and materialize as a branch.</p>
                    <ul className="list-inside list-disc space-y-1">
                      <li>Historical restore as branch</li>
                      <li>7–30 day retention</li>
                      <li>Incident rollback in minutes</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-4 w-4 text-indigo-600" aria-hidden="true" /> Read Scaling
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>Read-only compute endpoints isolate analytics from transactional workloads.</p>
                    <ul className="list-inside list-disc space-y-1">
                      <li>Instant read-only endpoints</li>
                      <li>Isolate analytics from OLTP</li>
                      <li>No storage duplication</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4 text-indigo-600" aria-hidden="true" /> Connection Pooling
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>PgBouncer pooling stabilizes bursts and enables 10k+ concurrent logical sessions.</p>
                    <ul className="list-inside list-disc space-y-1">
                      <li>10k+ logical sessions</li>
                      <li>Stabilize serverless bursts</li>
                      <li>Reduce cold-start friction</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Architecture Doctrine */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-600" aria-hidden="true" />
                <h3 className="text-lg font-semibold">Architecture Doctrine</h3>
              </div>
              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Compute & Storage Separation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">•</span>
                        <span>Compute scales independently from storage</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">•</span>
                        <span>Pay for active compute; storage remains durable</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">•</span>
                        <span>Branch-first enables safe experimentation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">•</span>
                        <span>Recovery is a first-class workflow</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Resilience & Tenant Safety
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>Strict tenancy enforcement (RLS + policies)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>Audit-ready recovery via PITR → branch</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>Operational consistency across runtimes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>Security declaration published & testable</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Resilience Plane */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-600" aria-hidden="true" />
                <h3 className="text-lg font-semibold">Resilience Plane</h3>
              </div>
              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold text-sm mb-3">Backup Strategy</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-600 mt-1.5 shrink-0" />
                      <span><strong>Hourly snapshots</strong> - Automated continuous backups</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-600 mt-1.5 shrink-0" />
                      <span><strong>7-day PITR</strong> - Point-in-time recovery window</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-600 mt-1.5 shrink-0" />
                      <span><strong>WAL archiving</strong> - Write-Ahead Log preservation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-600 mt-1.5 shrink-0" />
                      <span><strong>Cross-region</strong> - Geographic redundancy</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold text-sm mb-3">Recovery Metrics</h4>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Recovery Time Objective (RTO)</dt>
                      <dd className="font-semibold text-green-600">&lt; 1 hour</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Recovery Point Objective (RPO)</dt>
                      <dd className="font-semibold text-green-600">&lt; 5 minutes</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Data Durability</dt>
                      <dd className="font-semibold text-green-600">99.999999999% (11 nines)</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Uptime SLA</dt>
                      <dd className="font-semibold text-green-600">99.9% monthly</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </section>

            {/* Observability Plane */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-pink-600" aria-hidden="true" />
                <h3 className="text-lg font-semibold">Observability Plane</h3>
              </div>
              <Separator />

              <div className="rounded-lg border p-4">
                <h4 className="font-semibold text-sm mb-2">Operational Monitoring</h4>
                <p className="text-sm text-muted-foreground">
                  Compute scales between configured min/max CU based on workload demands. During idle periods, the system
                  scales down to minimize costs. Under heavy load, it scales up to maintain performance.
                </p>
              </div>
            </section>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href={marketingRoutes.external.orchestra.root()}>Go to AFENDA</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={marketingRoutes.ui.security()}>View Security Declaration</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href={marketingRoutes.ui.terms()}>Terms of Service</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

