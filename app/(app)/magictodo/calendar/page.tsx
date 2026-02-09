/**
 * @domain magictodo
 * @layer ui
 * @responsibility UI route entrypoint for /app/magictodo/calendar
 * Lazy-loads calendar content for smaller initial bundle.
 */

"use client";

import dynamic from "next/dynamic";
import CalendarLoading from "./loading";

const CalendarContent = dynamic(
  () => import("./CalendarContent").then((m) => m.default),
  { ssr: false, loading: () => <CalendarLoading /> }
);

export default function CalendarPage() {
  return <CalendarContent />;
}
