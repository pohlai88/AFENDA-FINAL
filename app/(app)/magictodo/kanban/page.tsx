/**
 * @domain magictodo
 * @layer ui
 * @responsibility UI route entrypoint for /app/magictodo/kanban
 * Lazy-loads kanban content for smaller initial bundle.
 */

"use client";

import dynamic from "next/dynamic";
import KanbanLoading from "./loading";

const KanbanContent = dynamic(
  () => import("./KanbanContent").then((m) => m.default),
  { ssr: false, loading: () => <KanbanLoading /> }
);

export default function KanbanPage() {
  return <KanbanContent />;
}
