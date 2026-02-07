/**
 * Dashboard route loading state
 * @layer page
 * @responsibility Instant loading feedback during navigation (Next.js best practice)
 */

import { DashboardLoadingState } from "./_components/DashboardLoadingState";

export default function DashboardLoading() {
  return <DashboardLoadingState />;
}
