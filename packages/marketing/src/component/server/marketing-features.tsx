import { AfendaIcon } from "../client/afenda-icon";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@afenda/shadcn";

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: AfendaIcon,
    title: "NexusCanon Infrastructure",
    description:
      "Built on enterprise-grade infrastructure fabric with proven reliability and scalability for mission-critical workflows.",
  },
  {
    icon: AfendaIcon,
    title: "Row Level Security",
    description:
      "Advanced RLS implementation ensures data isolation at the database level, protecting tenant data with zero-trust architecture.",
  },
  {
    icon: AfendaIcon,
    title: "Multi-tenant Architecture",
    description:
      "Sophisticated tenant isolation with shared infrastructure, optimized for performance and cost-efficiency.",
  },
  {
    icon: AfendaIcon,
    title: "Type-safe API Contracts",
    description:
      "End-to-end type safety with validated API contracts, reducing runtime errors and improving developer experience.",
  },
  {
    icon: AfendaIcon,
    title: "PDPA Compliance",
    description:
      "Malaysia PDPA compliant by design with comprehensive data protection, privacy controls, and audit trails.",
  },
  {
    icon: AfendaIcon,
    title: "Module-based Design",
    description:
      "Flexible module orchestration allowing seamless integration of business capabilities with iframe-first approach.",
  },
];

interface MarketingFeaturesProps {
  className?: string;
}

/**
 * Marketing domain features section component.
 * Server component showcasing platform capabilities.
 * Follows shadcn best practices with proper card composition.
 */
export function MarketingFeatures({ className }: MarketingFeaturesProps) {
  return (
    <section className={className}>
      <div className="container py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Enterprise-Grade Features
          </h2>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Built for security, compliance, and scalability from the ground up
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="relative overflow-hidden transition-all hover:shadow-lg"
              >
                <CardHeader>
                  <div className="mb-2 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-6 text-primary" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
