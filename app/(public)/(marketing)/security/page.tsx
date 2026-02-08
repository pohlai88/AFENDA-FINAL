/**
 * @domain marketing
 * @layer ui
 * @responsibility UI route entrypoint for /security
 */

import type { Metadata } from "next"
import Link from "next/link"
import { AfendaIcon as BrandIcon } from "@afenda/marketing"

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
  title: "Security Declaration",
  description: "Comprehensive security and compliance declaration for AFENDA, powered by NexusCanon Infrastructure Fabric with SOC 2 Type II, HIPAA, GDPR, CCPA, and ISO 27001 compliance",
  alternates: {
    canonical: "/security",
  },
  openGraph: {
    title: "Security Declaration - AFENDA",
    description: "Defense-in-depth security powered by NexusCanon with SOC 2 Type II, HIPAA, GDPR, CCPA. Military-grade encryption, zero-trust architecture, and immutable audit trails.",
    type: "website",
    url: "/security",
  },
  twitter: {
    card: "summary_large_image",
    title: "Security Declaration - AFENDA",
    description: "Enterprise security with SOC 2, HIPAA, GDPR, CCPA compliance and defense-in-depth architecture.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function SecurityPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-16">
      <div className="w-full">
        <Card>
          <CardHeader className="space-y-3 text-center">
            <CardTitle className="text-3xl">Security Declaration</CardTitle>
            <CardDescription>
              Defense-in-depth security, compliance, and resilience practices for AFENDA powered by NexusCanon Infrastructure Fabric.
            </CardDescription>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline" className="gap-1">
                <BrandIcon className="h-3 w-3" aria-hidden="true" /> SOC 2 Type II
              </Badge>
              <Badge variant="outline" className="gap-1">
                <BrandIcon className="h-3 w-3" aria-hidden="true" /> HIPAA BAA
              </Badge>
              <Badge variant="outline" className="gap-1">
                <BrandIcon className="h-3 w-3" aria-hidden="true" /> GDPR + CCPA
              </Badge>
              <Badge variant="outline" className="gap-1">
                <BrandIcon className="h-3 w-3" aria-hidden="true" /> ISO 27001
              </Badge>
              <Badge variant="outline" className="gap-1">
                <BrandIcon className="h-3 w-3" aria-hidden="true" /> NexusCanon Engine
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4 text-sm">
                <h3 className="font-semibold">Zero-Trust Access</h3>
                <p className="text-muted-foreground mt-2">
                  RBAC, RLS, and short‑lived tokens enforce least‑privilege access across tenants and services.
                </p>
              </div>
              <div className="rounded-lg border p-4 text-sm">
                <h3 className="font-semibold">Military-Grade Encryption</h3>
                <p className="text-muted-foreground mt-2">
                  AES‑256‑GCM encryption at rest, TLS 1.3 in transit, and hardware‑backed key management protect all data layers.
                </p>
              </div>
              <div className="rounded-lg border p-4 text-sm">
                <h3 className="font-semibold">Operational Resilience</h3>
                <p className="text-muted-foreground mt-2">
                  Automated backups, PITR, and documented recovery objectives support business continuity.
                </p>
              </div>
            </section>
            {/* Compliance Certifications */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BrandIcon className="h-5 w-5 text-green-600" aria-hidden="true" />
                <h3 className="text-lg font-semibold">Compliance Certifications</h3>
              </div>
              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">SOC 2 Type II</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>Annual third-party attestation covering:</p>
                    <ul className="list-inside list-disc space-y-1">
                      <li>Security controls and policies</li>
                      <li>99.95% availability guarantees</li>
                      <li>Processing integrity and accuracy</li>
                      <li>Confidentiality and privacy measures</li>
                      <li>Continuous monitoring and incident response</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">HIPAA Compliance</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>Healthcare data protection with:</p>
                    <ul className="list-inside list-disc space-y-1">
                      <li>Business Associate Agreement (BAA) available</li>
                      <li>ePHI encryption (AES-256-GCM) and access controls</li>
                      <li>365-day immutable audit logging</li>
                      <li>Incident response and breach notification procedures</li>
                      <li>Regular security risk assessments</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">GDPR Compliance</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>EU data protection compliance:</p>
                    <ul className="list-inside list-disc space-y-1">
                      <li>Primary data residency in Singapore (ap-southeast-1)</li>
                      <li>Right to access, rectification, erasure (&quot;right to be forgotten&quot;)</li>
                      <li>Data portability in standard formats</li>
                      <li>Privacy by design and default architecture</li>
                      <li>Data Protection Impact Assessments (DPIA)</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">CCPA Compliance</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>California consumer privacy:</p>
                    <ul className="list-inside list-disc space-y-1">
                      <li>Right to know what data is collected and how it&apos;s used</li>
                      <li>Right to delete personal information with cryptographic erasure</li>
                      <li>Opt-out of data sales (we never sell data)</li>
                      <li>Non-discrimination guarantees for exercising rights</li>
                      <li>Transparent privacy notices and disclosures</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Encryption Standards */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BrandIcon className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Encryption Standards</h3>
              </div>
              <Separator />

              <div className="space-y-3 text-sm">
                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold mb-2">Data at Rest</h4>
                  <p className="text-muted-foreground">
                    <strong>AES-256-GCM encryption</strong> for all database storage. Data is encrypted at the block level using
                    military-grade algorithms with hardware-backed key management, automatic key rotation, and cryptographic erasure for deletion.
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold mb-2">Data in Transit</h4>
                  <p className="text-muted-foreground">
                    <strong>TLS 1.3 encryption</strong> for all network communications. Client and internal service connections
                    are encrypted using strong cipher suites.
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold mb-2">Key Management</h4>
                  <p className="text-muted-foreground">
                    Encryption keys are managed using hardware security modules (HSM) with automated 90-day rotation schedules,
                    multi-party authorization, and strict access controls. Keys are stored separately from encrypted data with
                    geographic redundancy and immutable audit trails for all key operations.
                  </p>
                </div>
              </div>
            </div>

            {/* Authentication & Access Control */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BrandIcon className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold">Authentication & Access Control</h3>
              </div>
              <Separator />

              <div className="space-y-3 text-sm">
                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold mb-2">OAuth 2.0 Authentication</h4>
                  <p className="text-muted-foreground">
                    Secure authentication using industry-standard OAuth 2.0 with support for Google, GitHub, and Microsoft identity providers.
                    JWTs are short-lived (15 min) with secure refresh tokens, automatic rotation, and device fingerprinting.
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold mb-2">Role-Based Access Control (RBAC)</h4>
                  <p className="text-muted-foreground">
                    Granular permissions management with predefined roles and custom role creation. The principle of least privilege
                    is enforced across all system components.
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold mb-2">Row-Level Security (RLS)</h4>
                  <p className="text-muted-foreground">
                    NexusCanon RLS policies ensure users can only access their authorized data. Policies are enforced at the database
                    layer with zero-trust verification, providing defense in depth. Multi-tenant isolation is cryptographically enforced.
                  </p>
                </div>
              </div>
            </div>

            {/* Audit & Monitoring */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BrandIcon className="h-5 w-5 text-orange-600" />
                <h3 className="text-lg font-semibold">Audit Logging & Monitoring</h3>
              </div>
              <Separator />

              <div className="rounded-lg border p-4 text-sm">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <BrandIcon className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span><strong>90-day audit log retention</strong> - All authentication attempts, data access, and modifications logged</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <BrandIcon className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span><strong>Real-time monitoring</strong> - Continuous security monitoring with automated alerts for suspicious activity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <BrandIcon className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span><strong>Full activity tracking</strong> - Complete audit trail of user actions, API calls, and system events</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <BrandIcon className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span><strong>Compliance reporting</strong> - Automated compliance reports for HIPAA, GDPR, and SOC 2 requirements</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Backup & Disaster Recovery */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BrandIcon className="h-5 w-5 text-cyan-600" />
                <h3 className="text-lg font-semibold">Backup & Disaster Recovery</h3>
              </div>
              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4 text-sm">
                  <h4 className="font-semibold mb-2">Automated Backups</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Hourly automated snapshots with continuous WAL archiving</li>
                    <li>• 30-day point-in-time recovery (PITR) with second-level granularity</li>
                    <li>• Continuous Write-Ahead Logging (WAL) with encryption</li>
                    <li>• Cross-region backup replication for disaster recovery</li>
                    <li>• Immutable backup storage to prevent tampering</li>
                  </ul>
                </div>

                <div className="rounded-lg border p-4 text-sm">
                  <h4 className="font-semibold mb-2">Recovery Objectives</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• RTO (Recovery Time Objective): &lt; 30 minutes</li>
                    <li>• RPO (Recovery Point Objective): &lt; 1 minute</li>
                    <li>• Data durability: 99.999999999% (11 nines)</li>
                    <li>• Tested disaster recovery procedures (quarterly)</li>
                    <li>• Automated failover with zero data loss</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* NexusCanon Capacity & Infrastructure */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BrandIcon className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-semibold">Infrastructure Capacity</h3>
              </div>
              <Separator />

              <div className="grid gap-4 md:grid-cols-3 text-sm">
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-600">Unlimited</div>
                  <div className="text-muted-foreground">Elastic Storage</div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-600">0.25-8 CU</div>
                  <div className="text-muted-foreground">Auto-scaling Compute</div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-600">10,000+</div>
                  <div className="text-muted-foreground">Pooled Connections</div>
                </div>
              </div>

              <div className="rounded-lg border p-4 text-sm">
                <h4 className="font-semibold mb-2">Region & Availability</h4>
                <p className="text-muted-foreground">
                  <strong>ap-southeast-1 (Singapore)</strong> - Primary data residency with 99.95% uptime SLA. Multi-AZ deployment across
                  3 availability zones for high availability, automatic failover, and disaster recovery. Additional regions available upon request.
                </p>
              </div>
            </div>

            {/* Responsible Disclosure */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BrandIcon className="h-5 w-5 text-slate-600" />
                <h3 className="text-lg font-semibold">Vulnerability Disclosure</h3>
              </div>
              <Separator />
              <div className="rounded-lg border p-4 text-sm">
                <p className="text-muted-foreground">
                  We welcome responsible disclosure of security issues. Please report findings to
                  <a className="underline ml-1" href="mailto:legal@nexuscanon.com">legal@nexuscanon.com</a> with
                  sufficient detail for triage.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-4">
              <Button asChild>
                <Link href={marketingRoutes.external.orchestra.root()}>Go to AFENDA</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={marketingRoutes.ui.infrastructure()}>View Infrastructure Details</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href={marketingRoutes.ui.privacy()}>Privacy Policy</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

