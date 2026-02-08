/**
 * @domain marketing
 * @layer ui
 * @responsibility UI route entrypoint for /contact
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
  Separator,
} from "@afenda/shadcn";
import { marketingSiteConfig, marketingRoutes } from "@afenda/marketing";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with AFENDA team for support, sales inquiries, security reports, or general questions.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact - AFENDA",
    description: "Contact AFENDA for enterprise workflow orchestration support and inquiries.",
    type: "website",
    url: "/contact",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="w-full space-y-8">
        <Card>
          <CardHeader className="space-y-3 text-center">
            <CardTitle className="text-3xl">Contact Us</CardTitle>
            <CardDescription className="text-lg">
              Get in touch with our team for support, inquiries, or security reports
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            <section className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AfendaIcon className="h-5 w-5 text-blue-600" aria-hidden="true" />
                    <CardTitle className="text-base">General Inquiries</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    For general questions about AFENDA, features, or partnership opportunities.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>Email:</strong>{" "}
                      <a
                        href={`mailto:${marketingSiteConfig.supportEmail}`}
                        className="text-blue-600 hover:underline"
                      >
                        {marketingSiteConfig.supportEmail}
                      </a>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Response time: Within 24-48 hours
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AfendaIcon className="h-5 w-5 text-red-600" aria-hidden="true" />
                    <CardTitle className="text-base">Security Reports</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Report security vulnerabilities through our responsible disclosure program.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>Email:</strong>{" "}
                      <a
                        href={`mailto:${marketingSiteConfig.supportEmail}`}
                        className="text-red-600 hover:underline"
                      >
                        {marketingSiteConfig.supportEmail}
                      </a>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Subject: Security Vulnerability Report
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AfendaIcon className="h-5 w-5 text-green-600" aria-hidden="true" />
                    <CardTitle className="text-base">Technical Support</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Get help with technical issues, integration questions, or platform usage.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>Email:</strong>{" "}
                      <a
                        href={`mailto:${marketingSiteConfig.supportEmail}`}
                        className="text-green-600 hover:underline"
                      >
                        {marketingSiteConfig.supportEmail}
                      </a>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Subject: Technical Support Request
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AfendaIcon className="h-5 w-5 text-purple-600" aria-hidden="true" />
                    <CardTitle className="text-base">PDPA Data Requests</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Exercise your rights under Malaysia&apos;s Personal Data Protection Act 2010.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>Email:</strong>{" "}
                      <a
                        href={`mailto:${marketingSiteConfig.supportEmail}`}
                        className="text-purple-600 hover:underline"
                      >
                        {marketingSiteConfig.supportEmail}
                      </a>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Subject: PDPA Data Subject Request
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <AfendaIcon className="h-5 w-5 text-indigo-600" aria-hidden="true" />
                <h3 className="text-lg font-semibold">Contact Information</h3>
              </div>
              <Separator />
              <div className="rounded-lg border p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold">Email</p>
                  <p className="text-sm text-muted-foreground">
                    <a
                      href={`mailto:${marketingSiteConfig.supportEmail}`}
                      className="text-blue-600 hover:underline"
                    >
                      {marketingSiteConfig.supportEmail}
                    </a>
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-semibold">Business Hours</p>
                  <p className="text-sm text-muted-foreground">
                    Monday - Friday: 9:00 AM - 6:00 PM (GMT+8)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Emergency security issues: 24/7 monitoring
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-semibold">Primary Region</p>
                  <p className="text-sm text-muted-foreground">
                    Singapore (ap-southeast-1)
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Before You Contact Us</h3>
              <Separator />
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Please check these resources first:</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-0.5">•</span>
                    <span>
                      <Link href={marketingRoutes.ui.docs()} className="text-blue-600 hover:underline">Documentation</Link> -
                      Comprehensive guides and tutorials
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-0.5">•</span>
                    <span>
                      <Link href={marketingRoutes.ui.apiDocs()} className="text-blue-600 hover:underline">API Reference</Link> -
                      Complete API documentation
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-0.5">•</span>
                    <span>
                      <Link href={marketingRoutes.ui.status()} className="text-blue-600 hover:underline">System Status</Link> -
                      Real-time platform status
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-0.5">•</span>
                    <span>
                      <Link href={marketingRoutes.ui.security()} className="text-blue-600 hover:underline">Security Declaration</Link> -
                      Security and compliance information
                    </span>
                  </li>
                </ul>
              </div>
            </section>

            <div className="flex flex-col gap-2 pt-4">
              <Button asChild>
                <a href={`mailto:${marketingSiteConfig.supportEmail}`}>
                  Send Email
                </a>
              </Button>
              <Button asChild variant="outline">
                <Link href={marketingRoutes.ui.docs()}>View Documentation</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href={marketingRoutes.ui.about()}>Learn More About Us</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
