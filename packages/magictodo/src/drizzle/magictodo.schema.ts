import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uuid,
  pgEnum,
  index
} from "drizzle-orm/pg-core";

/**
 * magictodo domain tables (authoritative DB schema slice).
 * Prefix all tables with "magictodo_" to avoid conflicts.
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
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow(),
    organizationId: text("organization_id"),
    teamId: text("team_id"),
  },
  (table) => ({
    userIdIdx: index("magictodo_tasks_user_id_idx").on(table.userId),
    projectIdIdx: index("magictodo_tasks_project_id_idx").on(table.projectId),
    statusIdx: index("magictodo_tasks_status_idx").on(table.status),
    dueDateIdx: index("magictodo_tasks_due_date_idx").on(table.dueDate),
    parentTaskIdIdx: index("magictodo_tasks_parent_task_id_idx").on(table.parentTaskId),
  })
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
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow(),
    organizationId: text("organization_id"),
    teamId: text("team_id"),
  },
  (table) => ({
    userIdIdx: index("magictodo_projects_user_id_idx").on(table.userId),
    archivedIdx: index("magictodo_projects_archived_idx").on(table.archived),
  })
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
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow(),
    organizationId: text("organization_id"),
    teamId: text("team_id"),
  },
  (table) => ({
    userIdIdx: index("magictodo_focus_sessions_user_id_idx").on(table.userId),
    statusIdx: index("magictodo_focus_sessions_status_idx").on(table.status),
    startedAtIdx: index("magictodo_focus_sessions_started_at_idx").on(table.startedAt),
  })
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
  (table) => ({
    sessionIdIdx: index("magictodo_focus_queue_session_idx").on(table.sessionId),
    taskIdIdx: index("magictodo_focus_queue_task_idx").on(table.taskId),
    sessionPositionIdx: index("magictodo_focus_queue_session_position_idx").on(table.sessionId, table.position),
  })
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
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow(),
    organizationId: text("organization_id"),
    teamId: text("team_id"),
  },
  (table) => ({
    taskIdIdx: index("magictodo_snoozed_tasks_task_id_idx").on(table.taskId),
    userIdIdx: index("magictodo_snoozed_tasks_user_id_idx").on(table.userId),
    snoozedUntilIdx: index("magictodo_snoozed_tasks_snoozed_until_idx").on(table.snoozedUntil),
    dependencyTaskIdIdx: index("magictodo_snoozed_tasks_dependency_task_id_idx").on(table.dependencyTaskId),
  })
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
  (table) => ({
    taskIdIdx: index("magictodo_task_deps_task_idx").on(table.taskId),
    dependsOnTaskIdIdx: index("magictodo_task_deps_depends_on_idx").on(table.dependsOnTaskId),
    uniqueDependency: index("magictodo_task_deps_unique_idx").on(table.taskId, table.dependsOnTaskId),
  })
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
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow(),
    organizationId: text("organization_id"),
    teamId: text("team_id"),
  },
  (table) => ({
    taskIdIdx: index("magictodo_time_entries_task_id_idx").on(table.taskId),
    userIdIdx: index("magictodo_time_entries_user_id_idx").on(table.userId),
    startTimeIdx: index("magictodo_time_entries_start_time_idx").on(table.startTime),
  })
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
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow(),
    organizationId: text("organization_id"),
    teamId: text("team_id"),
  },
  (table) => ({
    taskIdIdx: index("magictodo_task_comments_task_id_idx").on(table.taskId),
    userIdIdx: index("magictodo_task_comments_user_id_idx").on(table.userId),
    parentIdIdx: index("magictodo_task_comments_parent_id_idx").on(table.parentId),
    createdAtIdx: index("magictodo_task_comments_created_at_idx").on(table.createdAt),
  })
);
