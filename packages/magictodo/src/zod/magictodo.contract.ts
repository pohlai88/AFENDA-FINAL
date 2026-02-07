/**
 * MagicTodo Task & Project Contracts
 * 
 * @domain magictodo
 * @layer contract
 * @responsibility Zod schemas for API validation and type inference
 * @pattern discriminatedUnion for API responses, transform for coercion
 */

import { z } from "zod"

// ============ Coercion Helpers ============
/**
 * Transform ISO date string to Date object
 */
const dateStringToDate = z.string().datetime().transform((val) => new Date(val))

/**
 * Coerce empty string to undefined
 */
const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value)

/**
 * Normalize status string to lowercase
 */
const _normalizeStatus = (value: unknown) => 
  typeof value === "string" ? value.toLowerCase().trim() : value

// ============ Priority ============
export const TASK_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
} as const

export const TaskPriority = z.enum([
  TASK_PRIORITY.LOW,
  TASK_PRIORITY.MEDIUM,
  TASK_PRIORITY.HIGH,
  TASK_PRIORITY.URGENT,
])
export type TaskPriority = z.infer<typeof TaskPriority>

// ============ Task Status ============
export const TASK_STATUS = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done",
  CANCELLED: "cancelled",
} as const

export const TaskStatus = z.enum([
  TASK_STATUS.TODO,
  TASK_STATUS.IN_PROGRESS,
  TASK_STATUS.DONE,
  TASK_STATUS.CANCELLED,
])
export type TaskStatus = z.infer<typeof TaskStatus>

// ============ Recurrence Rules ============
export const RECURRENCE_FREQUENCY = {
  DAILY: "daily",
  WEEKLY: "weekly",
  BIWEEKLY: "biweekly",
  MONTHLY: "monthly",
  YEARLY: "yearly",
} as const

export const RecurrenceFrequency = z.enum([
  RECURRENCE_FREQUENCY.DAILY,
  RECURRENCE_FREQUENCY.WEEKLY,
  RECURRENCE_FREQUENCY.BIWEEKLY,
  RECURRENCE_FREQUENCY.MONTHLY,
  RECURRENCE_FREQUENCY.YEARLY,
])
export type RecurrenceFrequency = z.infer<typeof RecurrenceFrequency>

export const recurrenceRuleSchema = z.object({
  frequency: RecurrenceFrequency,
  interval: z.number().int().min(1).default(1).describe("e.g., every N days/weeks"),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional().describe("0=Sun, 6=Sat; for weekly/biweekly"),
  daysOfMonth: z.array(z.number().min(1).max(31)).optional().describe("For monthly rules"),
  endDate: z.string().datetime().optional().describe("Recurrence stops after this date"),
  maxOccurrences: z.number().int().min(1).optional().describe("Recurrence stops after N occurrences"),
})

export type RecurrenceRule = z.infer<typeof recurrenceRuleSchema>

// ============ Advanced Recurrence Rules ============
/**
 * Extended recurrence with timezone, business days, exceptions
 */
export const WEEKDAY = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
} as const

export const NTH_OCCURRENCE = {
  FIRST: 1,
  SECOND: 2,
  THIRD: 3,
  FOURTH: 4,
  LAST: -1,
} as const

/**
 * Pattern for "nth weekday of month" (e.g., 2nd Tuesday)
 */
export const nthWeekdaySchema = z.object({
  nth: z.number().int().min(-1).max(4).describe("-1=last, 1=first, 2=second, etc."),
  weekday: z.number().int().min(0).max(6).describe("0=Sunday, 6=Saturday"),
})
export type NthWeekday = z.infer<typeof nthWeekdaySchema>

/**
 * Advanced recurrence rule with business day support
 */
export const advancedRecurrenceSchema = recurrenceRuleSchema.extend({
  timezone: z.string().max(100).optional().describe("IANA timezone (e.g., 'America/New_York')"),
  skipWeekends: z.boolean().optional().describe("Skip Sat/Sun, move to next business day"),
  skipHolidays: z.boolean().optional().describe("Skip holidays if holiday list provided"),
  businessDaysOnly: z.boolean().optional().describe("Only generate on Mon-Fri"),
  nthWeekday: nthWeekdaySchema.optional().describe("e.g., 2nd Tuesday of every month"),
  exceptions: z.array(z.string().datetime()).optional().describe("Specific dates to skip"),
  additions: z.array(z.string().datetime()).optional().describe("Extra dates to include"),
  holidayRegion: z.string().max(10).optional().describe("e.g., 'US', 'UK' for holiday detection"),
  adjustmentStrategy: z.enum(["skip", "before", "after"]).default("after")
    .describe("When skipping weekends/holidays: skip occurrence, move before, or move after"),
})
export type AdvancedRecurrence = z.infer<typeof advancedRecurrenceSchema>

/**
 * Create/update request for advanced recurrence
 */
export const advancedRecurrenceRequestSchema = advancedRecurrenceSchema.omit({
  // All fields are optional for flexibility
}).partial()
export type AdvancedRecurrenceRequest = z.infer<typeof advancedRecurrenceRequestSchema>

// ============ Task Assignees ============
export const ASSIGNEE_ROLE = {
  ASSIGNEE: "assignee",
  REVIEWER: "reviewer",
  OBSERVER: "observer",
} as const

export const AssigneeRole = z.enum([
  ASSIGNEE_ROLE.ASSIGNEE,
  ASSIGNEE_ROLE.REVIEWER,
  ASSIGNEE_ROLE.OBSERVER,
])
export type AssigneeRole = z.infer<typeof AssigneeRole>

export const taskAssigneeResponseSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  userId: z.string(),
  role: AssigneeRole,
  assignedAt: z.string().datetime(),
  assignedBy: z.string().nullable(),
  // Optional user details (from join)
  displayName: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
})

export type TaskAssigneeResponse = z.infer<typeof taskAssigneeResponseSchema>

export const addTaskAssigneeRequestSchema = z.object({
  userId: z.string().uuid().describe("User ID to assign"),
  role: AssigneeRole.default(ASSIGNEE_ROLE.ASSIGNEE).describe("Assignment role"),
})

export type AddTaskAssigneeRequest = z.infer<typeof addTaskAssigneeRequestSchema>

export const taskAssigneeListResponseSchema = z.object({
  items: z.array(taskAssigneeResponseSchema),
  total: z.number(),
})

export type TaskAssigneeListResponse = z.infer<typeof taskAssigneeListResponseSchema>

export const removeTaskAssigneeParamsSchema = z.object({
  id: z.string().uuid().describe("Task ID"),
  userId: z.string().uuid().describe("User ID to remove"),
})

export type RemoveTaskAssigneeParams = z.infer<typeof removeTaskAssigneeParamsSchema>

// ============ Task History Actions ============
export const TASK_HISTORY_ACTION = {
  CREATED: "created",
  UPDATED: "updated",
  COMPLETED: "completed",
  DELETED: "deleted",
  AUTO_GENERATED: "auto_generated",
  AUTO_CANCELLED_OVERDUE: "auto_cancelled_overdue",
} as const

export const TaskHistoryAction = z.enum([
  TASK_HISTORY_ACTION.CREATED,
  TASK_HISTORY_ACTION.UPDATED,
  TASK_HISTORY_ACTION.COMPLETED,
  TASK_HISTORY_ACTION.DELETED,
  TASK_HISTORY_ACTION.AUTO_GENERATED,
  TASK_HISTORY_ACTION.AUTO_CANCELLED_OVERDUE,
])
export type TaskHistoryAction = z.infer<typeof TaskHistoryAction>

// ============ Task Schemas ============
const taskBaseSchema = z.object({
  title: z.string().min(1).max(255).describe("Task title"),
  description: z.string().max(5000).optional().describe("Markdown description"),
  dueDate: z.string().datetime().optional().describe("ISO 8601 date + time"),
  priority: TaskPriority.default(TASK_PRIORITY.MEDIUM),
  status: TaskStatus.default(TASK_STATUS.TODO),
  projectId: z.string().optional().describe("Associated project"),
  tags: z.array(z.string().max(50)).optional().default([]).describe("User-defined tags"),
  recurrence: recurrenceRuleSchema.optional().describe("Recurrence rule if repeating"),
  parentTaskId: z.string().optional().describe("For sub-tasks (future)"),
})

export const createTaskRequestSchema = taskBaseSchema.extend({
  nlText: z.string().optional().describe("Natural language: 'tomorrow 9am call with Bob'"),
})

export const updateTaskRequestSchema = taskBaseSchema.partial()

export type CreateTaskRequest = z.infer<typeof createTaskRequestSchema>
export type UpdateTaskRequest = z.infer<typeof updateTaskRequestSchema>

export const taskResponseSchema = taskBaseSchema.extend({
  id: z.string().describe("Task ID (UUID)"),
  userId: z.string().describe("Owner user ID"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional().describe("When marked done"),
  nextOccurrenceDate: z.string().datetime().optional().describe("For recurring tasks, next due"),
  // Hierarchy fields
  level: z.number().optional().describe("Task depth in hierarchy (0 = root)"),
  path: z.string().optional().describe("Materialized path (e.g., 'rootId/parentId/id')"),
  hierarchyCode: z.string().optional().describe("Globally unique hierarchy code (e.g., 'AX7-T1001-01')"),
  isPinned: z.boolean().optional().describe("Pinned to top of list"),
  isStarred: z.boolean().optional().describe("Starred for quick access"),
  visibility: z.enum(["private", "team", "org", "public"]).optional().describe("Task visibility scope"),
  // Team collaboration fields
  assignees: z.array(taskAssigneeResponseSchema).optional().describe("Task assignees"),
  assigneeCount: z.number().optional().describe("Count of assignees (for list views)"),
})

export type TaskResponse = z.infer<typeof taskResponseSchema>

// ============ Project Schemas ============
const projectBaseSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  color: z.string().optional().describe("Hex color for UI"),
  archived: z.boolean().default(false),
})

export const createProjectRequestSchema = projectBaseSchema

export const updateProjectRequestSchema = projectBaseSchema.partial()

export const projectResponseSchema = projectBaseSchema.extend({
  id: z.string(),
  userId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  taskCount: z.number().optional().describe("Number of tasks in project"),
})

export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>
export type UpdateProjectRequest = z.infer<typeof updateProjectRequestSchema>
export type ProjectResponse = z.infer<typeof projectResponseSchema>

// ============ Param Validation Schemas ============
export const taskParamsSchema = z.object({
  id: z.string().uuid("Invalid task ID"),
})

export const projectParamsSchema = z.object({
  id: z.string().uuid("Invalid project ID"),
})

export type TaskParams = z.infer<typeof taskParamsSchema>
export type ProjectParams = z.infer<typeof projectParamsSchema>

// ============ Query Schemas ============
export const taskQuerySchema = z.object({
  status: z.preprocess(emptyToUndefined, TaskStatus.optional()),
  priority: z.preprocess(emptyToUndefined, TaskPriority.optional()),
  projectId: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  limit: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).max(100).default(50)
  ),
  offset: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(0).default(0)
  ),
})

export const projectQuerySchema = z.object({
  includeArchived: z.preprocess(
    (value) => (value === "true" ? true : value === "false" ? false : undefined),
    z.boolean().default(false)
  ),
})

// ============ List Response Schemas ============
export const taskListResponseSchema = z.object({
  items: z.array(taskResponseSchema),
  total: z.number().describe("Total count for pagination"),
  limit: z.number().describe("Items per page"),
  offset: z.number().describe("Pagination offset"),
})

export const projectListResponseSchema = z.object({
  items: z.array(projectResponseSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
})

export type TaskListResponse = z.infer<typeof taskListResponseSchema>
export type ProjectListResponse = z.infer<typeof projectListResponseSchema>

// ============ Quick-Add NL Parser Result ============
export const nlParseResultSchema = z.object({
  title: z.string(),
  dueDate: z.string().datetime().optional(),
  priority: TaskPriority.optional(),
  tags: z.array(z.string()).optional(),
})

export type NlParseResult = z.infer<typeof nlParseResultSchema>

// ============ Advanced Filtering ============
export const TASK_FILTERING = {
  SEARCH_FIELDS: {
    ALL: "all",
    TITLE: "title",
    DESCRIPTION: "description",
    TAGS: "tags",
  },
  SEARCH_MATCH_TYPES: {
    CONTAINS: "contains",
    EXACT: "exact",
    STARTS_WITH: "starts_with",
    ENDS_WITH: "ends_with",
  },
  INCLUDE_MODES: {
    ANY: "any",
    ALL: "all",
  },
  SORT_OPTIONS: {
    CREATED_AT: "createdAt",
    UPDATED_AT: "updatedAt",
    DUE_DATE: "dueDate",
    PRIORITY: "priority",
    TITLE: "title",
  },
  SORT_ORDER: {
    ASC: "asc",
    DESC: "desc",
  },
  DEFAULTS: {
    SORT_BY: "createdAt" as const,
    SORT_ORDER: "desc" as const,
  },
} as const

export const dateRangeFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  relativeRange: z.enum([
    "today", "yesterday", "this_week", "last_week",
    "this_month", "last_month", "this_quarter", "last_quarter",
    "this_year", "last_year", "overdue", "due_today",
    "due_this_week", "due_this_month",
  ]).optional(),
})

export type DateRangeFilter = z.infer<typeof dateRangeFilterSchema>

export const searchFilterSchema = z.object({
  query: z.string().min(1).max(255),
  fields: z.array(z.enum(Object.values(TASK_FILTERING.SEARCH_FIELDS) as [string, ...string[]]))
    .default([TASK_FILTERING.SEARCH_FIELDS.ALL]),
  matchType: z.enum(Object.values(TASK_FILTERING.SEARCH_MATCH_TYPES) as [string, ...string[]])
    .default(TASK_FILTERING.SEARCH_MATCH_TYPES.CONTAINS),
})

export type SearchFilter = z.infer<typeof searchFilterSchema>

export const multiSelectFilterSchema = z.object({
  values: z.array(z.string()),
  includeMode: z.enum(Object.values(TASK_FILTERING.INCLUDE_MODES) as [string, ...string[]])
    .default(TASK_FILTERING.INCLUDE_MODES.ANY),
})

export type MultiSelectFilter = z.infer<typeof multiSelectFilterSchema>

export const advancedTaskFiltersSchema = z.object({
  search: searchFilterSchema.optional(),
  createdDate: dateRangeFilterSchema.optional(),
  dueDate: dateRangeFilterSchema.optional(),
  completedDate: dateRangeFilterSchema.optional(),
  status: multiSelectFilterSchema.optional(),
  priority: multiSelectFilterSchema.optional(),
  tags: multiSelectFilterSchema.optional(),
  projects: multiSelectFilterSchema.optional(),
  hasDueDate: z.boolean().optional(),
  isOverdue: z.boolean().optional(),
  hasRecurrence: z.boolean().optional(),
  hasDescription: z.boolean().optional(),
  hasTags: z.boolean().optional(),
  estimatedDuration: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional(),
  }).optional(),
  sortBy: z.enum(Object.values(TASK_FILTERING.SORT_OPTIONS) as [string, ...string[]])
    .default(TASK_FILTERING.DEFAULTS.SORT_BY),
  sortOrder: z.enum(Object.values(TASK_FILTERING.SORT_ORDER) as [string, ...string[]])
    .default(TASK_FILTERING.DEFAULTS.SORT_ORDER),
})

export type AdvancedTaskFilters = z.infer<typeof advancedTaskFiltersSchema>

export const taskFilterRequestSchema = z.object({
  filters: advancedTaskFiltersSchema.optional().default({
    sortBy: TASK_FILTERING.DEFAULTS.SORT_BY,
    sortOrder: TASK_FILTERING.DEFAULTS.SORT_ORDER,
  }),
  pagination: z.object({
    limit: z.number().min(1).max(100).default(50),
    offset: z.number().min(0).default(0),
  }).optional().default({
    limit: 50,
    offset: 0,
  }),
})

export type TaskFilterRequest = z.infer<typeof taskFilterRequestSchema>

export const filteredTaskListResponseSchema = taskListResponseSchema.extend({
  filters: advancedTaskFiltersSchema.optional(),
  facets: z.object({
    statusCounts: z.record(z.string(), z.number()),
    priorityCounts: z.record(z.string(), z.number()),
    projectCounts: z.record(z.string(), z.number()),
    tagCounts: z.record(z.string(), z.number()),
    totalCount: z.number(),
  }).optional(),
})

export type FilteredTaskListResponse = z.infer<typeof filteredTaskListResponseSchema>

// ============ Filter Presets ============
export const filterPresetSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  filters: advancedTaskFiltersSchema,
  isDefault: z.boolean().default(false),
  userId: z.string(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
})

export type FilterPreset = z.infer<typeof filterPresetSchema>

// ============ API Response Discriminated Unions ============
/**
 * Type-safe API response handling using discriminated unions
 * Pattern: status field determines success/error branch
 */

// Generic API response wrapper
export const apiSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    status: z.literal("success"),
    data: dataSchema,
    timestamp: z.string().datetime().optional(),
  })

export const apiErrorResponseSchema = z.object({
  status: z.literal("error"),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
  timestamp: z.string().datetime().optional(),
})

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>

// Task-specific API responses
export const taskApiResponseSchema = z.discriminatedUnion("status", [
  apiSuccessResponseSchema(taskResponseSchema),
  apiErrorResponseSchema,
])

export const taskListApiResponseSchema = z.discriminatedUnion("status", [
  apiSuccessResponseSchema(taskListResponseSchema),
  apiErrorResponseSchema,
])

export const filteredTaskListApiResponseSchema = z.discriminatedUnion("status", [
  apiSuccessResponseSchema(filteredTaskListResponseSchema),
  apiErrorResponseSchema,
])

// Project-specific API responses
export const projectApiResponseSchema = z.discriminatedUnion("status", [
  apiSuccessResponseSchema(projectResponseSchema),
  apiErrorResponseSchema,
])

export const projectListApiResponseSchema = z.discriminatedUnion("status", [
  apiSuccessResponseSchema(projectListResponseSchema),
  apiErrorResponseSchema,
])

// Type exports for discriminated unions
export type TaskApiResponse = z.infer<typeof taskApiResponseSchema>
export type TaskListApiResponse = z.infer<typeof taskListApiResponseSchema>
export type FilteredTaskListApiResponse = z.infer<typeof filteredTaskListApiResponseSchema>
export type ProjectApiResponse = z.infer<typeof projectApiResponseSchema>
export type ProjectListApiResponse = z.infer<typeof projectListApiResponseSchema>

// ============ Parsed Task Schema (with Date transforms) ============
/**
 * Task schema with Date objects instead of ISO strings
 * Use for client-side processing after API response
 */
export const parsedTaskSchema = taskBaseSchema.extend({
  id: z.string(),
  userId: z.string(),
  createdAt: dateStringToDate,
  updatedAt: dateStringToDate,
  completedAt: z.string().datetime().transform((val) => new Date(val)).optional(),
  nextOccurrenceDate: z.string().datetime().transform((val) => new Date(val)).optional(),
  dueDate: z.string().datetime().transform((val) => new Date(val)).optional(),
})

export type ParsedTask = z.infer<typeof parsedTaskSchema>

// ============ Subtasks ============
/**
 * Subtask schema - child task of a parent task
 */
export const subtaskSchema = z.object({
  id: z.string(),
  parentTaskId: z.string(),
  title: z.string().min(1).max(500),
  completed: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
})
export type Subtask = z.infer<typeof subtaskSchema>

export const createSubtaskRequestSchema = z.object({
  parentTaskId: z.string(),
  title: z.string().min(1).max(500),
  order: z.number().int().min(0).optional(),
})
export type CreateSubtaskRequest = z.infer<typeof createSubtaskRequestSchema>

export const updateSubtaskRequestSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  completed: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
})
export type UpdateSubtaskRequest = z.infer<typeof updateSubtaskRequestSchema>

/**
 * Task with subtasks extension
 */
export const taskWithSubtasksSchema = taskResponseSchema.extend({
  subtasks: z.array(subtaskSchema).optional().default([]),
  subtaskCount: z.number().int().min(0).default(0),
  completedSubtaskCount: z.number().int().min(0).default(0),
})
export type TaskWithSubtasks = z.infer<typeof taskWithSubtasksSchema>

// ============ Task Templates ============
/**
 * Reusable task template schema
 */
export const taskTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  template: createTaskRequestSchema.omit({ nlText: true }),
  userId: z.string(),
  isShared: z.boolean().default(false),
  usageCount: z.number().int().min(0).default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type TaskTemplate = z.infer<typeof taskTemplateSchema>

export const createTaskTemplateRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  template: createTaskRequestSchema.omit({ nlText: true }),
  isShared: z.boolean().optional().default(false),
})
export type CreateTaskTemplateRequest = z.infer<typeof createTaskTemplateRequestSchema>

export const updateTaskTemplateRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  template: createTaskRequestSchema.omit({ nlText: true }).optional(),
  isShared: z.boolean().optional(),
})
export type UpdateTaskTemplateRequest = z.infer<typeof updateTaskTemplateRequestSchema>

// ============ Time Tracking ============
/**
 * Time entry for tracking work on tasks
 */
export const timeEntrySchema = z.object({
  id: z.string(),
  taskId: z.string(),
  userId: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  duration: z.number().int().min(0).optional(), // seconds
  notes: z.string().max(1000).optional(),
  createdAt: z.string().datetime(),
})
export type TimeEntry = z.infer<typeof timeEntrySchema>

export const createTimeEntryRequestSchema = z.object({
  taskId: z.string(),
  startTime: z.string().datetime().optional(), // defaults to now
  notes: z.string().max(1000).optional(),
})
export type CreateTimeEntryRequest = z.infer<typeof createTimeEntryRequestSchema>

export const stopTimeEntryRequestSchema = z.object({
  endTime: z.string().datetime().optional(), // defaults to now
  notes: z.string().max(1000).optional(),
})
export type StopTimeEntryRequest = z.infer<typeof stopTimeEntryRequestSchema>

/**
 * Task with time tracking extension
 */
export const taskWithTimeTrackingSchema = taskResponseSchema.extend({
  timeEntries: z.array(timeEntrySchema).optional().default([]),
  totalTimeSpent: z.number().int().min(0).default(0), // seconds
  estimatedTime: z.number().int().min(0).optional(), // seconds
  activeTimeEntry: timeEntrySchema.optional(), // currently running timer
})
export type TaskWithTimeTracking = z.infer<typeof taskWithTimeTrackingSchema>

/**
 * Time tracking summary for analytics
 */
export const timeTrackingSummarySchema = z.object({
  taskId: z.string(),
  totalTime: z.number().int().min(0), // seconds
  entryCount: z.number().int().min(0),
  averageSessionDuration: z.number().int().min(0), // seconds
  longestSession: z.number().int().min(0), // seconds
  lastTrackedAt: z.string().datetime().optional(),
})
export type TimeTrackingSummary = z.infer<typeof timeTrackingSummarySchema>

// ============ Task Dependencies ============
/**
 * Dependency types:
 * - blocks: Target task cannot start until source is complete
 * - relates_to: Informational link between related tasks
 * - duplicates: Tasks are duplicates (usually one gets closed)
 */
export const DEPENDENCY_TYPE = {
  BLOCKS: "blocks",
  RELATES_TO: "relates_to",
  DUPLICATES: "duplicates",
} as const

export const DependencyType = z.enum([
  DEPENDENCY_TYPE.BLOCKS,
  DEPENDENCY_TYPE.RELATES_TO,
  DEPENDENCY_TYPE.DUPLICATES,
])
export type DependencyType = z.infer<typeof DependencyType>

export const taskDependencySchema = z.object({
  id: z.string(),
  taskId: z.string(), // The task that has the dependency
  dependsOnTaskId: z.string(), // The task it depends on
  type: DependencyType,
  createdAt: z.string().datetime(),
  createdBy: z.string(), // userId
})
export type TaskDependency = z.infer<typeof taskDependencySchema>

export const createTaskDependencyRequestSchema = z.object({
  dependsOnTaskId: z.string(),
  type: DependencyType,
})
export type CreateTaskDependencyRequest = z.infer<typeof createTaskDependencyRequestSchema>

/**
 * Task with dependencies extension
 */
export const taskWithDependenciesSchema = taskResponseSchema.extend({
  dependencies: z.array(taskDependencySchema).optional().default([]),
  dependents: z.array(taskDependencySchema).optional().default([]), // Tasks that depend on this one
  isBlocked: z.boolean().default(false), // True if any blocking dependency is incomplete
  blockedByTasks: z.array(z.string()).optional().default([]), // IDs of tasks blocking this one
})
export type TaskWithDependencies = z.infer<typeof taskWithDependenciesSchema>

// ============ Task Comments ============
/**
 * Comment on a task for team discussion
 */
export const taskCommentSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  userId: z.string(),
  content: z.string().min(1).max(5000),
  mentions: z.array(z.string()).optional().default([]), // User IDs mentioned
  parentCommentId: z.string().optional(), // For threaded replies
  isEdited: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type TaskComment = z.infer<typeof taskCommentSchema>

export const createTaskCommentRequestSchema = z.object({
  content: z.string().min(1).max(5000),
  mentions: z.array(z.string()).optional(),
  parentCommentId: z.string().optional(), // For threaded replies
})
export type CreateTaskCommentRequest = z.infer<typeof createTaskCommentRequestSchema>

export const updateTaskCommentRequestSchema = z.object({
  content: z.string().min(1).max(5000),
  mentions: z.array(z.string()).optional(),
})
export type UpdateTaskCommentRequest = z.infer<typeof updateTaskCommentRequestSchema>

/**
 * Task with comments extension
 */
export const taskWithCommentsSchema = taskResponseSchema.extend({
  comments: z.array(taskCommentSchema).optional().default([]),
  commentCount: z.number().int().min(0).default(0),
  lastCommentAt: z.string().datetime().optional(),
})
export type TaskWithComments = z.infer<typeof taskWithCommentsSchema>

// ============ Task Attachments ============
/**
 * File attachment linked to a task via MagicFolder
 */
export const taskAttachmentSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  magicfolderObjectId: z.string(), // Reference to magicfolder object
  filename: z.string().max(255),
  mimeType: z.string().max(100),
  size: z.number().int().min(0), // bytes
  uploadedBy: z.string(), // userId
  uploadedAt: z.string().datetime(),
})
export type TaskAttachment = z.infer<typeof taskAttachmentSchema>

export const createTaskAttachmentRequestSchema = z.object({
  magicfolderObjectId: z.string(),
  filename: z.string().max(255),
  mimeType: z.string().max(100),
  size: z.number().int().min(0),
})
export type CreateTaskAttachmentRequest = z.infer<typeof createTaskAttachmentRequestSchema>

/**
 * Task with attachments extension
 */
export const taskWithAttachmentsSchema = taskResponseSchema.extend({
  attachments: z.array(taskAttachmentSchema).optional().default([]),
  attachmentCount: z.number().int().min(0).default(0),
})
export type TaskWithAttachments = z.infer<typeof taskWithAttachmentsSchema>

// ============ Kanban Board State ============
/**
 * Kanban column definition
 */
export const kanbanColumnSchema = z.object({
  id: z.string(),
  title: z.string().max(100),
  taskIds: z.array(z.string()).default([]),
  color: z.string().max(20).optional(), // hex or tailwind color
  limit: z.number().int().min(0).optional(), // WIP limit
})
export type KanbanColumn = z.infer<typeof kanbanColumnSchema>

/**
 * Kanban board configuration
 */
export const kanbanBoardStateSchema = z.object({
  columns: z.array(kanbanColumnSchema),
  columnOrder: z.array(z.string()), // Column IDs in display order
  collapsedColumns: z.array(z.string()).default([]), // Collapsed column IDs
  showSubtasks: z.boolean().default(true),
  groupBy: z.enum(["status", "priority", "project", "assignee"]).default("status"),
})
export type KanbanBoardState = z.infer<typeof kanbanBoardStateSchema>

// ============ Smart Snooze ============
/**
 * Snooze types for intelligent task deferral
 */
export const SNOOZE_TYPE = {
  DATETIME: "datetime",        // Snooze until specific datetime
  RELATIVE: "relative",        // Snooze for duration (1 hour, tomorrow, etc.)
  TASK_COMPLETE: "task_complete", // Snooze until another task is complete
  SCHEDULE: "schedule",        // Snooze until next scheduled time slot
} as const

export const SnoozeType = z.enum([
  SNOOZE_TYPE.DATETIME,
  SNOOZE_TYPE.RELATIVE,
  SNOOZE_TYPE.TASK_COMPLETE,
  SNOOZE_TYPE.SCHEDULE,
])
export type SnoozeType = z.infer<typeof SnoozeType>

/**
 * Relative snooze presets
 */
export const SNOOZE_PRESET = {
  LATER_TODAY: "later_today",      // +3 hours or 5pm
  TONIGHT: "tonight",              // 7pm today
  TOMORROW_MORNING: "tomorrow_morning", // 9am tomorrow
  TOMORROW_AFTERNOON: "tomorrow_afternoon", // 2pm tomorrow
  NEXT_WEEK: "next_week",          // Monday 9am
  NEXT_WEEKEND: "next_weekend",    // Saturday 10am
  CUSTOM: "custom",                // User-specified datetime
} as const

export const SnoozePreset = z.enum([
  SNOOZE_PRESET.LATER_TODAY,
  SNOOZE_PRESET.TONIGHT,
  SNOOZE_PRESET.TOMORROW_MORNING,
  SNOOZE_PRESET.TOMORROW_AFTERNOON,
  SNOOZE_PRESET.NEXT_WEEK,
  SNOOZE_PRESET.NEXT_WEEKEND,
  SNOOZE_PRESET.CUSTOM,
])
export type SnoozePreset = z.infer<typeof SnoozePreset>

/**
 * Snooze state for a task
 */
export const taskSnoozeSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  type: SnoozeType,
  snoozedAt: z.string().datetime(),
  snoozedUntil: z.string().datetime().optional(), // For datetime/relative types
  snoozedUntilTaskId: z.string().optional(), // For task_complete type
  preset: SnoozePreset.optional(), // Which preset was used
  snoozeCount: z.number().int().min(0).default(0), // How many times snoozed
  createdBy: z.string(), // userId
})
export type TaskSnooze = z.infer<typeof taskSnoozeSchema>

/**
 * Request to snooze a task
 */
export const snoozeTaskRequestSchema = z.object({
  type: SnoozeType,
  preset: SnoozePreset.optional(), // For relative type with preset
  snoozedUntil: z.string().datetime().optional(), // For datetime/custom
  snoozedUntilTaskId: z.string().optional(), // For task_complete type
  timezone: z.string().max(100).optional(), // User's timezone for smart scheduling
})
export type SnoozeTaskRequest = z.infer<typeof snoozeTaskRequestSchema>

/**
 * User's snooze preferences (learned patterns)
 */
export const snoozePreferencesSchema = z.object({
  userId: z.string(),
  morningStartTime: z.string().default("09:00"), // When morning presets target
  eveningTime: z.string().default("19:00"), // When evening presets target
  weekStartDay: z.number().int().min(0).max(6).default(1), // 0=Sun, 1=Mon
  defaultTimezone: z.string().max(100).optional(),
  smartScheduling: z.boolean().default(true), // Learn from patterns
  updatedAt: z.string().datetime(),
})
export type SnoozePreferences = z.infer<typeof snoozePreferencesSchema>

/**
 * Task with snooze extension
 */
export const taskWithSnoozeSchema = taskResponseSchema.extend({
  snooze: taskSnoozeSchema.optional(),
  isSnoozed: z.boolean().default(false),
  snoozeCount: z.number().int().min(0).default(0),
})
export type TaskWithSnooze = z.infer<typeof taskWithSnoozeSchema>

// ============ Focus Queue ============
/**
 * Focus session state - single-task mode
 */
export const FOCUS_SESSION_STATUS = {
  ACTIVE: "active",
  PAUSED: "paused",
  COMPLETED: "completed",
  ABANDONED: "abandoned",
} as const

export const FocusSessionStatus = z.enum([
  FOCUS_SESSION_STATUS.ACTIVE,
  FOCUS_SESSION_STATUS.PAUSED,
  FOCUS_SESSION_STATUS.COMPLETED,
  FOCUS_SESSION_STATUS.ABANDONED,
])
export type FocusSessionStatus = z.infer<typeof FocusSessionStatus>

/**
 * Queue item in focus mode
 */
export const focusQueueItemSchema = z.object({
  taskId: z.string(),
  position: z.number().int().min(0),
  addedAt: z.string().datetime(),
  skippedCount: z.number().int().min(0).default(0), // Times skipped in queue
})
export type FocusQueueItem = z.infer<typeof focusQueueItemSchema>

/**
 * Focus session - working on one task at a time
 */
export const focusSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  status: FocusSessionStatus,
  currentTaskId: z.string().optional(), // Currently focused task
  queue: z.array(focusQueueItemSchema).default([]), // Tasks in queue
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  totalFocusTime: z.number().int().min(0).default(0), // seconds
  tasksCompleted: z.number().int().min(0).default(0),
  tasksSkipped: z.number().int().min(0).default(0),
  breaks: z.number().int().min(0).default(0), // Number of pauses
})
export type FocusSession = z.infer<typeof focusSessionSchema>

/**
 * Request to start a focus session
 */
export const startFocusSessionRequestSchema = z.object({
  taskIds: z.array(z.string()).min(1).max(20).optional(), // Specific tasks
  filters: advancedTaskFiltersSchema.optional(), // Or filter-based queue
  dailyGoal: z.number().int().min(1).max(50).optional(), // Target tasks
})
export type StartFocusSessionRequest = z.infer<typeof startFocusSessionRequestSchema>

/**
 * Focus streak tracking
 */
export const focusStreakSchema = z.object({
  userId: z.string(),
  currentStreak: z.number().int().min(0).default(0), // Consecutive days
  longestStreak: z.number().int().min(0).default(0),
  lastFocusDate: z.string().datetime().optional(),
  totalFocusMinutes: z.number().int().min(0).default(0),
  totalTasksCompleted: z.number().int().min(0).default(0),
  weeklyFocusMinutes: z.array(z.number().int().min(0)).length(7).default([0,0,0,0,0,0,0]),
})
export type FocusStreak = z.infer<typeof focusStreakSchema>

/**
 * Daily focus stats
 */
export const dailyFocusStatsSchema = z.object({
  date: z.string().datetime(),
  userId: z.string(),
  focusMinutes: z.number().int().min(0).default(0),
  tasksCompleted: z.number().int().min(0).default(0),
  sessionsCount: z.number().int().min(0).default(0),
  longestSession: z.number().int().min(0).default(0), // minutes
  goalMet: z.boolean().default(false),
})
export type DailyFocusStats = z.infer<typeof dailyFocusStatsSchema>

/**
 * Focus mode preferences
 */
export const focusPreferencesSchema = z.object({
  userId: z.string(),
  dailyGoal: z.number().int().min(1).max(50).default(5), // Tasks per day
  sessionDuration: z.number().int().min(5).max(180).default(25), // Pomodoro minutes
  breakDuration: z.number().int().min(1).max(60).default(5), // Break minutes
  longBreakDuration: z.number().int().min(5).max(120).default(15),
  longBreakInterval: z.number().int().min(2).max(10).default(4), // After N sessions
  autoStartTimer: z.boolean().default(true), // Auto-start time tracking
  showMotivation: z.boolean().default(true), // Show streak/encouragement
  soundEnabled: z.boolean().default(true),
  updatedAt: z.string().datetime(),
})
export type FocusPreferences = z.infer<typeof focusPreferencesSchema>

// ============ API Response Helpers ============
/**
 * Type guard for successful API response
 */
export function isApiSuccess<T>(
  response: { status: "success"; data: T } | ApiErrorResponse
): response is { status: "success"; data: T; timestamp?: string } {
  return response.status === "success"
}

/**
 * Type guard for error API response
 */
export function isApiError(
  response: { status: string }
): response is ApiErrorResponse {
  return response.status === "error"
}

/**
 * Extract data from successful response or throw
 */
export function unwrapApiResponse<T>(
  response: { status: "success"; data: T; timestamp?: string } | ApiErrorResponse
): T {
  if (response.status === "success") {
    return response.data
  }
  // Type is narrowed to ApiErrorResponse here
  throw new Error((response as ApiErrorResponse).error.message)
}
