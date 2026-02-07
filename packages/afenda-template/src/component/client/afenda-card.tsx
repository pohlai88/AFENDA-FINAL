"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@afenda/shadcn";

/**
 * Afenda domain client component example.
 * Uses shadcn primitives, adds domain-specific UI.
 */
export function AfendaCard({
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

export function AfendaCardExample() {
  return (
    <AfendaCard title="Afenda Domain">
      <p>This is an afenda domain component.</p>
    </AfendaCard>
  );
}
