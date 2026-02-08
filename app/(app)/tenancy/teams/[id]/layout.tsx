/**
 * @domain tenancy
 * @layer route-ui
 * @responsibility Team detail layout with breadcrumb and tabs
 */

import { TeamDetailHeader } from "./_components/TeamDetailHeader";

export default async function TeamDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TeamDetailHeader teamId={id}>{children}</TeamDetailHeader>;
}
