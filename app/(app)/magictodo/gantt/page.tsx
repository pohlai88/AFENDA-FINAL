/**
 * @domain magictodo
 * @layer ui
 * @responsibility UI route entrypoint for /app/magictodo/gantt
 * Lazy-loads Gantt chart content for smaller initial bundle.
 */

"use client";

import dynamic from "next/dynamic";
import GanttLoading from "./loading";

const GanttChartContent = dynamic(
  () => import("./GanttChartContent").then((m) => m.default),
  { ssr: false, loading: () => <GanttLoading /> }
);

export default function GanttChartPage() {
  return <GanttChartContent />;
}
