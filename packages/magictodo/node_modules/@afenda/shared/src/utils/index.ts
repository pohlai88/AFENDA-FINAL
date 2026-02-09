/**
 * Shared utility exports.
 * Cross-domain pure utilities — no business logic.
 *
 * @domain shared
 * @layer utils
 */

import { cn as shadcnCn } from "@afenda/shadcn/lib/utils";

/** Re-export of shadcn `cn()` — Tailwind class name merger. */
export const cn = shadcnCn;

/** Client-side structured logger for browser components. */
export { logger, type LogContext } from "./client-logger";
