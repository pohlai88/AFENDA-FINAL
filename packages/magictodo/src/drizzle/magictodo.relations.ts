/**
 * @layer domain (magictodo)
 * @responsibility Drizzle ORM relation definitions for MagicTodo domain tables.
 *
 * Enables the relational query API:
 * ```ts
 * db.query.magictodoTasks.findMany({ with: { project: true, comments: true } })
 * ```
 *
 * NOTE: magictodoTasks and magictodoTaskComments are typed as `any` in the schema
 * due to self-referential FKs. Relations still work at runtime.
 */

import { relations } from "drizzle-orm";
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

// ─── Tasks ───────────────────────────────────────────────────────────
export const magictodoTasksRelations = relations(
  magictodoTasks,
  ({ one, many }) => ({
    project: one(magictodoProjects, {
      fields: [magictodoTasks.projectId],
      references: [magictodoProjects.id],
    }),
    parent: one(magictodoTasks, {
      fields: [magictodoTasks.parentTaskId],
      references: [magictodoTasks.id],
      relationName: "taskHierarchy",
    }),
    children: many(magictodoTasks, { relationName: "taskHierarchy" }),
    focusSessionQueue: many(magictodoFocusSessionQueue),
    snoozedTasks: many(magictodoSnoozedTasks),
    dependenciesAsTask: many(magictodoTaskDependencies, { relationName: "taskDeps" }),
    dependenciesAsDep: many(magictodoTaskDependencies, { relationName: "depOn" }),
    timeEntries: many(magictodoTimeEntries),
    comments: many(magictodoTaskComments),
  })
);

// ─── Projects ────────────────────────────────────────────────────────
export const magictodoProjectsRelations = relations(
  magictodoProjects,
  ({ many }) => ({
    tasks: many(magictodoTasks),
  })
);

// ─── Focus Sessions ──────────────────────────────────────────────────
export const magictodoFocusSessionsRelations = relations(
  magictodoFocusSessions,
  ({ one, many }) => ({
    currentTask: one(magictodoTasks, {
      fields: [magictodoFocusSessions.currentTaskId],
      references: [magictodoTasks.id],
    }),
    queue: many(magictodoFocusSessionQueue),
  })
);

// ─── Focus Session Queue ─────────────────────────────────────────────
export const magictodoFocusSessionQueueRelations = relations(
  magictodoFocusSessionQueue,
  ({ one }) => ({
    session: one(magictodoFocusSessions, {
      fields: [magictodoFocusSessionQueue.sessionId],
      references: [magictodoFocusSessions.id],
    }),
    task: one(magictodoTasks, {
      fields: [magictodoFocusSessionQueue.taskId],
      references: [magictodoTasks.id],
    }),
  })
);

// ─── Snoozed Tasks ──────────────────────────────────────────────────
export const magictodoSnoozedTasksRelations = relations(
  magictodoSnoozedTasks,
  ({ one }) => ({
    task: one(magictodoTasks, {
      fields: [magictodoSnoozedTasks.taskId],
      references: [magictodoTasks.id],
    }),
    dependencyTask: one(magictodoTasks, {
      fields: [magictodoSnoozedTasks.dependencyTaskId],
      references: [magictodoTasks.id],
    }),
  })
);

// ─── Task Dependencies ──────────────────────────────────────────────
export const magictodoTaskDependenciesRelations = relations(
  magictodoTaskDependencies,
  ({ one }) => ({
    task: one(magictodoTasks, {
      fields: [magictodoTaskDependencies.taskId],
      references: [magictodoTasks.id],
      relationName: "taskDeps",
    }),
    dependsOn: one(magictodoTasks, {
      fields: [magictodoTaskDependencies.dependsOnTaskId],
      references: [magictodoTasks.id],
      relationName: "depOn",
    }),
  })
);

// ─── Time Entries ────────────────────────────────────────────────────
export const magictodoTimeEntriesRelations = relations(
  magictodoTimeEntries,
  ({ one }) => ({
    task: one(magictodoTasks, {
      fields: [magictodoTimeEntries.taskId],
      references: [magictodoTasks.id],
    }),
  })
);

// ─── Task Comments ───────────────────────────────────────────────────
export const magictodoTaskCommentsRelations = relations(
  magictodoTaskComments,
  ({ one, many }) => ({
    task: one(magictodoTasks, {
      fields: [magictodoTaskComments.taskId],
      references: [magictodoTasks.id],
    }),
    parent: one(magictodoTaskComments, {
      fields: [magictodoTaskComments.parentId],
      references: [magictodoTaskComments.id],
      relationName: "commentThread",
    }),
    replies: many(magictodoTaskComments, { relationName: "commentThread" }),
  })
);
