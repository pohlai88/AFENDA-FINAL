"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@afenda/shadcn";

/**
 * marketing domain client component example.
 * Uses shadcn primitives, adds domain-specific UI.
 */
export function MarketingCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function MarketingCardExample() {
  return (
    <MarketingCard title="Marketing Domain">
      <p>This is a marketing domain component.</p>
    </MarketingCard>
  );
}
