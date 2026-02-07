/**
 * @domain marketing
 * @layer ui
 * @responsibility UI route entrypoint for /pdpa
 */

import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Lock, CheckCircle2, FileText, Scale, AlertCircle } from "lucide-react";
import { AfendaIcon as BrandIcon } from "@afenda/marketing";

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
import { marketingRoutes } from "@afenda/marketing";

// Static generation with ISR (revalidate monthly)
export const revalidate = 2592000;

export const metadata: Metadata = {
  title: "PDPA Compliance",
  description: "Personal Data Protection Act 2010 (Act 709) compliance for AFENDA powered by NexusCanon Infrastructure Fabric. Comprehensive data protection aligned with Malaysian law.",
  alternates: {
    canonical: "/pdpa",
  },
  openGraph: {
    title: "PDPA Compliance - AFENDA",
    description: "Full compliance with Malaysia's Personal Data Protection Act 2010 (Act 709). Enterprise-grade data protection with NexusCanon Infrastructure Fabric.",
    type: "website",
    url: "/pdpa",
  },
  twitter: {
    card: "summary",
    title: "PDPA Compliance - AFENDA",
    description: "Malaysia PDPA 2010 (Act 709) compliant data protection with enterprise security.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PDPAPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-16">
      <div className="w-full">
        <Card>
          <CardHeader className="space-y-3 text-center">
            <CardTitle className="text-3xl">Personal Data Protection Act (PDPA) Compliance</CardTitle>
            <CardDescription>
              Full compliance with Malaysia&apos;s Personal Data Protection Act 2010 (Act 709) powered by NexusCanon Infrastructure Fabric.
            </CardDescription>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline" className="gap-1">
                <BrandIcon className="h-3 w-3" aria-hidden="true" /> PDPA 2010 (Act 709)
              </Badge>
              <Badge variant="outline" className="gap-1">
                <BrandIcon className="h-3 w-3" aria-hidden="true" /> 7 Data Protection Principles
              </Badge>
              <Badge variant="outline" className="gap-1">
                <BrandIcon className="h-3 w-3" aria-hidden="true" /> Security Safeguards
              </Badge>
              <Badge variant="outline" className="gap-1">
                <BrandIcon className="h-3 w-3" aria-hidden="true" /> Registered Data User
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Overview */}
            <section className="space-y-4">
              <div className="rounded-lg border-l-4 border-blue-600 bg-blue-50 p-4 dark:bg-blue-950">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">PDPA Compliance Statement</h3>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      AFENDA is committed to full compliance with the Personal Data Protection Act 2010 (Act 709) of Malaysia.
                      We process personal data in accordance with the seven (7) Data Protection Principles and maintain registration
                      with the Personal Data Protection Commissioner of Malaysia.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Seven Data Protection Principles */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-semibold">Seven Data Protection Principles</h3>
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground">
                As mandated by Section 5 and Schedule 1 of the PDPA 2010, we adhere to all seven principles:
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      1. General Principle
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Section 5, Schedule 1 Part I</p>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>Personal data shall not be processed unless:</p>
                    <ul className="list-inside list-disc space-y-1 text-xs">
                      <li>Data subject has given consent (Section 6(1))</li>
                      <li>Processing is necessary for contract performance</li>
                      <li>Processing is required by law</li>
                      <li>Processing protects vital interests of data subject</li>
                    </ul>
                    <p className="text-xs font-semibold mt-2">Our Implementation:</p>
                    <p className="text-xs">Explicit consent obtained during registration with clear opt-in mechanisms. Contract-based processing for service delivery.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      2. Notice & Choice Principle
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Section 7, Schedule 1 Part II</p>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>Data subjects must be informed of:</p>
                    <ul className="list-inside list-disc space-y-1 text-xs">
                      <li>Purpose of data collection and processing</li>
                      <li>Source of personal data if not from data subject</li>
                      <li>Right to access and correct personal data</li>
                      <li>Identity of data user and contact information</li>
                    </ul>
                    <p className="text-xs font-semibold mt-2">Our Implementation:</p>
                    <p className="text-xs">Comprehensive privacy notice displayed at registration. Clear communication of data processing purposes and user rights.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      3. Disclosure Principle
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Section 8, Schedule 1 Part III</p>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>Personal data shall not be disclosed without consent except:</p>
                    <ul className="list-inside list-disc space-y-1 text-xs">
                      <li>Disclosure is for the purpose it was collected</li>
                      <li>Data subject has consented to disclosure</li>
                      <li>Disclosure is required by law or court order</li>
                    </ul>
                    <p className="text-xs font-semibold mt-2">Our Implementation:</p>
                    <p className="text-xs">Strict disclosure controls. Third-party sharing only with explicit consent or legal requirement. Vetted subprocessors under data processing agreements.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      4. Security Principle
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Section 9, Schedule 1 Part IV</p>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>Data user must protect personal data by:</p>
                    <ul className="list-inside list-disc space-y-1 text-xs">
                      <li>Practical security measures against loss, misuse, unauthorized access</li>
                      <li>Protection against unauthorized modification, disclosure, or destruction</li>
                      <li>Appropriate technical and organizational measures</li>
                    </ul>
                    <p className="text-xs font-semibold mt-2">Our Implementation:</p>
                    <p className="text-xs">Military-grade AES-256-GCM encryption, TLS 1.3, hardware-backed key management, multi-AZ deployment, 365-day immutable audit logs, zero-trust architecture.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      5. Retention Principle
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Section 10, Schedule 1 Part V</p>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>Personal data shall not be retained longer than necessary:</p>
                    <ul className="list-inside list-disc space-y-1 text-xs">
                      <li>Retention only for fulfillment of purpose</li>
                      <li>Retention for legal or business purposes</li>
                      <li>Secure destruction when no longer needed</li>
                    </ul>
                    <p className="text-xs font-semibold mt-2">Our Implementation:</p>
                    <p className="text-xs">Active account data retained during service period. Deleted data purged within 30 days using cryptographic erasure. Audit logs retained for 365 days for compliance and forensic purposes.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      6. Data Integrity Principle
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Section 11, Schedule 1 Part VI</p>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>Data user must ensure personal data is:</p>
                    <ul className="list-inside list-disc space-y-1 text-xs">
                      <li>Accurate, complete, and not misleading</li>
                      <li>Updated where necessary</li>
                      <li>Appropriate for the purpose of use</li>
                    </ul>
                    <p className="text-xs font-semibold mt-2">Our Implementation:</p>
                    <p className="text-xs">User-accessible profile management for data updates. Automated data validation. Regular data quality audits. Mechanisms for users to correct inaccurate information.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      7. Access Principle
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Section 12, Schedule 1 Part VII</p>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>Data subject has the right to:</p>
                    <ul className="list-inside list-disc space-y-1 text-xs">
                      <li>Request access to personal data (Section 30)</li>
                      <li>Request correction of personal data (Section 31)</li>
                      <li>Receive response within 21 days (Section 32)</li>
                      <li>Withdraw consent (Section 38)</li>
                    </ul>
                    <p className="text-xs font-semibold mt-2">Our Implementation:</p>
                    <p className="text-xs">Self-service data access portal. Data export in standard formats. Correction requests processed within 14 days. Consent withdrawal mechanisms with immediate effect.</p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Data Subject Rights */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold">Data Subject Rights Under PDPA 2010</h3>
              </div>
              <Separator />

              <div className="space-y-3 text-sm">
                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold mb-2">Right to Access (Section 30)</h4>
                  <p className="text-muted-foreground mb-2">
                    You have the right to request access to your personal data held by us. We will respond within 21 days as required by law.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Legal Reference:</strong> Personal Data Protection Act 2010, Section 30(1) - &quot;A data subject may make a data access request to a data user.&quot;
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold mb-2">Right to Correction (Section 31)</h4>
                  <p className="text-muted-foreground mb-2">
                    You have the right to request correction of inaccurate, incomplete, misleading, or not up-to-date personal data.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Legal Reference:</strong> Personal Data Protection Act 2010, Section 31(1) - &quot;A data subject may request a data user to correct his personal data.&quot;
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold mb-2">Right to Withdraw Consent (Section 38)</h4>
                  <p className="text-muted-foreground mb-2">
                    You may withdraw your consent for processing of personal data at any time, subject to legal or contractual restrictions.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Legal Reference:</strong> Personal Data Protection Act 2010, Section 38 - &quot;A data subject may, by notice in writing, withdraw his consent.&quot;
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold mb-2">Right to Prevent Processing (Section 40)</h4>
                  <p className="text-muted-foreground mb-2">
                    You may request to prevent processing likely to cause damage or distress to you or another person.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Legal Reference:</strong> Personal Data Protection Act 2010, Section 40 - &quot;A data subject may, at any time by notice in writing to a data user, require the data user to cease processing.&quot;
                  </p>
                </div>
              </div>
            </section>

            {/* Security Safeguards */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-orange-600" />
                <h3 className="text-lg font-semibold">Security Safeguards (Section 9 Compliance)</h3>
              </div>
              <Separator />

              <div className="rounded-lg border p-4 text-sm">
                <p className="text-muted-foreground mb-3">
                  In compliance with Section 9 of the PDPA 2010, we implement comprehensive security safeguards:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span><strong>Physical Security:</strong> Multi-AZ data centers with 24/7 monitoring, biometric access controls, and environmental safeguards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span><strong>Technical Security:</strong> AES-256-GCM encryption at rest, TLS 1.3 in transit, hardware-backed key management with 90-day rotation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span><strong>Administrative Security:</strong> Zero-trust RBAC, background checks for personnel, security awareness training, incident response procedures</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span><strong>Audit & Monitoring:</strong> 365-day immutable audit logs, real-time security monitoring, automated threat detection, quarterly security assessments</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Data Processing Registration */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-600" />
                <h3 className="text-lg font-semibold">Data User Registration (Section 16)</h3>
              </div>
              <Separator />

              <div className="rounded-lg border p-4 text-sm">
                <p className="text-muted-foreground mb-2">
                  AFENDA is registered as a Data User with the Personal Data Protection Commissioner of Malaysia in compliance with Section 16 of the PDPA 2010.
                </p>
                <p className="text-xs text-muted-foreground mt-3">
                  <strong>Legal Reference:</strong> Personal Data Protection Act 2010, Section 16(1) - &quot;Every data user shall register with the Commissioner.&quot;
                </p>
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-xs font-semibold mb-1">Registration Details:</p>
                  <ul className="text-xs space-y-1">
                    <li>• Data User: AFENDA (NexusCanon Infrastructure)</li>
                    <li>• Registration Status: Compliant with Section 16</li>
                    <li>• Data Protection Officer: Available upon request</li>
                    <li>• Contact: legal@nexuscanon.com</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Cross-Border Data Transfer */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                <h3 className="text-lg font-semibold">Cross-Border Data Transfer (Section 129)</h3>
              </div>
              <Separator />

              <div className="rounded-lg border p-4 text-sm">
                <p className="text-muted-foreground mb-3">
                  Personal data may be transferred outside Malaysia only in compliance with Section 129 of the PDPA 2010:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Transfer to countries with adequate data protection standards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Transfer with data subject consent</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Transfer necessary for contract performance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Transfer with appropriate safeguards (Standard Contractual Clauses)</span>
                  </li>
                </ul>
                <p className="text-xs text-muted-foreground mt-3">
                  <strong>Legal Reference:</strong> Personal Data Protection Act 2010, Section 129 - &quot;A data user shall not transfer any personal data to a place outside Malaysia unless to such place as specified by the Minister.&quot;
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  <strong>Our Implementation:</strong> Primary data residency in Singapore (ap-southeast-1). Cross-border transfers governed by Standard Contractual Clauses and data processing agreements with vetted subprocessors.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-slate-600" />
                <h3 className="text-lg font-semibold">Exercise Your Rights</h3>
              </div>
              <Separator />

              <div className="rounded-lg border p-4 text-sm">
                <p className="text-muted-foreground mb-3">
                  To exercise your rights under the PDPA 2010 or for any data protection inquiries:
                </p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>Email:</strong> <a href="mailto:legal@nexuscanon.com" className="underline">legal@nexuscanon.com</a></p>
                  <p><strong>Subject Line:</strong> PDPA Data Subject Request</p>
                  <p><strong>Response Time:</strong> Within 21 days as required by Section 32</p>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  For complaints regarding data protection, you may contact the Personal Data Protection Commissioner of Malaysia at <a href="https://www.pdp.gov.my" className="underline" target="_blank" rel="noopener noreferrer">www.pdp.gov.my</a>
                </p>
              </div>
            </section>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-4">
              <Button asChild>
                <Link href={marketingRoutes.external.orchestra.root()}>Go to AFENDA</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={marketingRoutes.ui.privacy()}>View Privacy Policy</Link>
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
  );
}
