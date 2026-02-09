// Drizzle stage barrel exports
export * from "./magictodo.schema";
export * from "./magictodo.relations";

import {
  magictodoTasks,
  magictodoProjects,
  magictodoFocusSessions,
  magictodoFocusSessionQueue,
  magictodoSnoozedTasks,
  magictodoTaskDependencies,
  magictodoTimeEntries,
  magictodoTaskComments,
} from "./magictodo.schema";

// ─── Type Exports ($inferSelect / $inferInsert) ─────────────────────
// Note: magictodoTasks and magictodoTaskComments are typed as `any` due to
// self-referential columns. Use explicit type annotations where needed.
export type MagicTodoTaskRow = typeof magictodoTasks.$inferSelect;
export type MagicTodoTaskInsert = typeof magictodoTasks.$inferInsert;
export type MagicTodoProjectRow = typeof magictodoProjects.$inferSelect;
export type MagicTodoProjectInsert = typeof magictodoProjects.$inferInsert;
export type MagicTodoFocusSessionRow = typeof magictodoFocusSessions.$inferSelect;
export type MagicTodoFocusSessionInsert = typeof magictodoFocusSessions.$inferInsert;
export type MagicTodoFocusSessionQueueRow = typeof magictodoFocusSessionQueue.$inferSelect;
export type MagicTodoFocusSessionQueueInsert = typeof magictodoFocusSessionQueue.$inferInsert;
export type MagicTodoSnoozedTaskRow = typeof magictodoSnoozedTasks.$inferSelect;
export type MagicTodoSnoozedTaskInsert = typeof magictodoSnoozedTasks.$inferInsert;
export type MagicTodoTaskDependencyRow = typeof magictodoTaskDependencies.$inferSelect;
export type MagicTodoTaskDependencyInsert = typeof magictodoTaskDependencies.$inferInsert;
export type MagicTodoTimeEntryRow = typeof magictodoTimeEntries.$inferSelect;
export type MagicTodoTimeEntryInsert = typeof magictodoTimeEntries.$inferInsert;
export type MagicTodoTaskCommentRow = typeof magictodoTaskComments.$inferSelect;
export type MagicTodoTaskCommentInsert = typeof magictodoTaskComments.$inferInsert;

/**
 * Type alias for Drizzle database instance.
 * Use this type for all service method parameters instead of 'any'.
 * Type-only imports prevent drizzle-orm from leaking into the client bundle.
 */
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import type * as schema from "./magictodo.schema";

export type DrizzleDB = NeonHttpDatabase<typeof schema>;
