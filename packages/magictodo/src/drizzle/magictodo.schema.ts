import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uuid,
  pgEnum,
  pgPolicy,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenancyColumns, tenancyIndexes } from "@afenda/tenancy/drizzle";
import {
  authenticatedRole,
  domainPolicies,
  timestamps,
  idx,
} from "@afenda/shared/drizzle/manifest";

/**
 * magictodo domain tables (authoritative DB schema slice).
 * Prefix all tables with "magictodo_" to avoid conflicts.
 *
 * ## Multi-Tenancy Contract
 *
 * Every domain table MUST have:
 *   - tenant_id (required, FK to tenancy.teams.id)
 *   - team_id (required, FK to tenancy.teams.id)
 *   - RLS policies enforcing tenant isolation
 *
 * @see .dev-note/multi-tenancy-schema.md
 */

// Enums
export const taskStatusEnum = pgEnum("magictodo_task_status", ["todo", "in_progress", "done", "cancelled"]);
export const taskPriorityEnum = pgEnum("magictodo_task_priority", ["low", "medium", "high", "urgent"]);
export const recurrenceFrequencyEnum = pgEnum("magictodo_recurrence_frequency", ["daily", "weekly", "biweekly", "monthly", "yearly"]);
export const focusSessionStatusEnum = pgEnum("magictodo_focus_session_status", ["active", "paused", "completed", "aborted"]);

// Tasks table (self-referential parentTaskId causes TS circular ref - suppress)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const magictodoTasks: any = pgTable(
  "magictodo_tasks",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    status: taskStatusEnum("status").notNull().default("todo"),
    priority: taskPriorityEnum("priority").notNull().default("medium"),
    dueDate: timestamp("due_date", { withTimezone: true, mode: "date" }),
    projectId: text("project_id").references(() => magictodoProjects.id, { onDelete: "set null" }),
    userId: text("user_id").notNull(),
    parentTaskId: text("parent_task_id").references(() => magictodoTasks.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    recurrenceRule: jsonb("recurrence_rule"), // For recurring tasks
    nextOccurrenceDate: timestamp("next_occurrence_date", { withTimezone: true, mode: "date" }),
    estimatedMinutes: integer("estimated_minutes"),
    actualMinutes: integer("actual_minutes"),
    tags: jsonb("tags"), // Array of tag strings
    customFields: jsonb("custom_fields"), // Custom field values
    position: integer("position").default(0), // For ordering
    ...timestamps(),
    ...tenancyColumns.withTenancy(),
  },
  (t) => [
    ...tenancyIndexes("magictodo_tasks", t),
    idx("magictodo_tasks", "user_id").on(t.userId),
    idx("magictodo_tasks", "project_id").on(t.projectId),
    idx("magictodo_tasks", "status").on(t.status),
    idx("magictodo_tasks", "due_date").on(t.dueDate),
    idx("magictodo_tasks", "parent_task_id").on(t.parentTaskId),
    ...domainPolicies("magictodo_tasks", t),
  ],
);

// Projects table
export const magictodoProjects = pgTable(
  "magictodo_projects",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color"), // Hex color code
    userId: text("user_id").notNull(),
    archived: boolean("archived").default(false),
    defaultPriority: taskPriorityEnum("default_priority").default("medium"),
    tags: jsonb("tags"), // Array of tag strings
    customFields: jsonb("custom_fields"), // Project-level custom field definitions
    ...timestamps(),
    ...tenancyColumns.withTenancy(),
  },
  (t) => [
    ...tenancyIndexes("magictodo_projects", t),
    idx("magictodo_projects", "user_id").on(t.userId),
    idx("magictodo_projects", "archived").on(t.archived),
    ...domainPolicies("magictodo_projects", t),
  ],
);

// Focus Sessions table
export const magictodoFocusSessions = pgTable(
  "magictodo_focus_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    status: focusSessionStatusEnum("status").notNull().default("active"),
    currentTaskId: text("current_task_id").references(() => magictodoTasks.id, { onDelete: "set null" }),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }).defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true, mode: "date" }),
    totalFocusTime: integer("total_focus_time").default(0), // Total seconds
    tasksCompleted: integer("tasks_completed").default(0),
    tasksSkipped: integer("tasks_skipped").default(0),
    breaks: integer("breaks").default(0),
    dailyGoal: integer("daily_goal").default(5), // Target tasks per day
    settings: jsonb("settings"), // Focus session settings
    ...timestamps(),
    ...tenancyColumns.withTenancy(),
  },
  (t) => [
    ...tenancyIndexes("magictodo_focus_sessions", t),
    idx("magictodo_focus_sessions", "user_id").on(t.userId),
    idx("magictodo_focus_sessions", "status").on(t.status),
    idx("magictodo_focus_sessions", "started_at").on(t.startedAt),
    ...domainPolicies("magictodo_focus_sessions", t),
  ],
);

// Focus Session Queue table (tasks in a focus session)
export const magictodoFocusSessionQueue = pgTable(
  "magictodo_focus_session_queue",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: text("session_id").references(() => magictodoFocusSessions.id, { onDelete: "cascade" }).notNull(),
    taskId: text("task_id").references(() => magictodoTasks.id, { onDelete: "cascade" }).notNull(),
    position: integer("position").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true, mode: "date" }).defaultNow(),
    skippedCount: integer("skipped_count").default(0),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
  },
  (t) => [
    idx("magictodo_focus_session_queue", "session_id").on(t.sessionId),
    idx("magictodo_focus_session_queue", "task_id").on(t.taskId),
    idx("magictodo_focus_session_queue", "session_id", "position").on(t.sessionId, t.position),
  ],
);

// Snoozed Tasks table
export const magictodoSnoozedTasks = pgTable(
  "magictodo_snoozed_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: text("task_id").references(() => magictodoTasks.id, { onDelete: "cascade" }).notNull(),
    userId: text("user_id").notNull(),
    snoozedUntil: timestamp("snoozed_until", { withTimezone: true, mode: "date" }).notNull(),
    reason: text("reason"), // Optional reason for snoozing
    snoozeCount: integer("snooze_count").default(0), // Track how many times snoozed
    dependencyTaskId: text("dependency_task_id").references(() => magictodoTasks.id, { onDelete: "cascade" }), // Snoozed until this task is done
    ...timestamps(),
    ...tenancyColumns.withTenancy(),
  },
  (t) => [
    ...tenancyIndexes("magictodo_snoozed_tasks", t),
    idx("magictodo_snoozed_tasks", "task_id").on(t.taskId),
    idx("magictodo_snoozed_tasks", "user_id").on(t.userId),
    idx("magictodo_snoozed_tasks", "snoozed_until").on(t.snoozedUntil),
    idx("magictodo_snoozed_tasks", "dependency_task_id").on(t.dependencyTaskId),
    ...domainPolicies("magictodo_snoozed_tasks", t),
  ],
);

// Task Dependencies table
export const magictodoTaskDependencies = pgTable(
  "magictodo_task_dependencies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: text("task_id").references(() => magictodoTasks.id, { onDelete: "cascade" }).notNull(),
    dependsOnTaskId: text("depends_on_task_id").references(() => magictodoTasks.id, { onDelete: "cascade" }).notNull(),
    dependencyType: text("dependency_type").notNull().default("finish_to_start"), // finish_to_start, start_to_start, etc.
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
  },
  (t) => [
    idx("magictodo_task_dependencies", "task_id").on(t.taskId),
    idx("magictodo_task_dependencies", "depends_on_task_id").on(t.dependsOnTaskId),
    idx("magictodo_task_dependencies", "task_id", "depends_on_task_id").on(t.taskId, t.dependsOnTaskId),
  ],
);

// Time Entries table (for time tracking)
export const magictodoTimeEntries = pgTable(
  "magictodo_time_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: text("task_id").references(() => magictodoTasks.id, { onDelete: "cascade" }).notNull(),
    userId: text("user_id").notNull(),
    startTime: timestamp("start_time", { withTimezone: true, mode: "date" }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true, mode: "date" }),
    durationSeconds: integer("duration_seconds"),
    description: text("description"),
    billable: boolean("billable").default(false),
    hourlyRate: integer("hourly_rate"), // In cents
    ...timestamps(),
    ...tenancyColumns.withTenancy(),
  },
  (t) => [
    ...tenancyIndexes("magictodo_time_entries", t),
    idx("magictodo_time_entries", "task_id").on(t.taskId),
    idx("magictodo_time_entries", "user_id").on(t.userId),
    idx("magictodo_time_entries", "start_time").on(t.startTime),
    ...domainPolicies("magictodo_time_entries", t),
  ],
);

// Task Comments table (self-referential parentId causes TS circular ref - suppress)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const magictodoTaskComments: any = pgTable(
  "magictodo_task_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: text("task_id").references(() => magictodoTasks.id, { onDelete: "cascade" }).notNull(),
    userId: text("user_id").notNull(),
    content: text("content").notNull(),
    parentId: uuid("parent_id").references(() => magictodoTaskComments.id, { onDelete: "cascade" }), // For threaded comments
    ...timestamps(),
    ...tenancyColumns.withTenancy(),
  },
  (t) => [
    ...tenancyIndexes("magictodo_task_comments", t),
    idx("magictodo_task_comments", "task_id").on(t.taskId),
    idx("magictodo_task_comments", "user_id").on(t.userId),
    idx("magictodo_task_comments", "parent_id").on(t.parentId),
    idx("magictodo_task_comments", "created_at").on(t.createdAt),
    ...domainPolicies("magictodo_task_comments", t),
  ],
);
