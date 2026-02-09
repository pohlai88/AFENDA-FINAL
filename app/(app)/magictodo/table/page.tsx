/**
 * @domain magictodo
 * @layer ui
 * @responsibility UI route entrypoint for /app/magictodo/table
 * Lazy-loads table view content for smaller initial bundle.
 */

"use client";

import dynamic from "next/dynamic";
import TableLoading from "./loading";

const TableContent = dynamic(
  () => import("./TableContent").then((m) => m.default),
  { ssr: false, loading: () => <TableLoading /> }
);

export default function TableViewPage() {
  return <TableContent />;
}
