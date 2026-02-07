CREATE TYPE "public"."magictodo_focus_session_status" AS ENUM('active', 'paused', 'completed', 'aborted');--> statement-breakpoint
CREATE TYPE "public"."magictodo_recurrence_frequency" AS ENUM('daily', 'weekly', 'biweekly', 'monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."magictodo_task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."magictodo_task_status" AS ENUM('todo', 'in_progress', 'done', 'cancelled');--> statement-breakpoint
CREATE TABLE "magictodo_focus_session_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"task_id" text NOT NULL,
	"position" integer NOT NULL,
	"added_at" timestamp with time zone DEFAULT now(),
	"skipped_count" integer DEFAULT 0,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "magictodo_focus_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" "magictodo_focus_session_status" DEFAULT 'active' NOT NULL,
	"current_task_id" text,
	"started_at" timestamp with time zone DEFAULT now(),
	"ended_at" timestamp with time zone,
	"total_focus_time" integer DEFAULT 0,
	"tasks_completed" integer DEFAULT 0,
	"tasks_skipped" integer DEFAULT 0,
	"breaks" integer DEFAULT 0,
	"daily_goal" integer DEFAULT 5,
	"settings" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"organization_id" text,
	"team_id" text
);
--> statement-breakpoint
CREATE TABLE "magictodo_projects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text,
	"user_id" text NOT NULL,
	"archived" boolean DEFAULT false,
	"default_priority" "magictodo_task_priority" DEFAULT 'medium',
	"tags" jsonb,
	"custom_fields" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"organization_id" text,
	"team_id" text
);
--> statement-breakpoint
CREATE TABLE "magictodo_snoozed_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" text NOT NULL,
	"user_id" text NOT NULL,
	"snoozed_until" timestamp with time zone NOT NULL,
	"reason" text,
	"snooze_count" integer DEFAULT 0,
	"dependency_task_id" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"organization_id" text,
	"team_id" text
);
--> statement-breakpoint
CREATE TABLE "magictodo_task_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"organization_id" text,
	"team_id" text
);
--> statement-breakpoint
CREATE TABLE "magictodo_task_dependencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" text NOT NULL,
	"depends_on_task_id" text NOT NULL,
	"dependency_type" text DEFAULT 'finish_to_start' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "magictodo_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "magictodo_task_status" DEFAULT 'todo' NOT NULL,
	"priority" "magictodo_task_priority" DEFAULT 'medium' NOT NULL,
	"due_date" timestamp with time zone,
	"project_id" text,
	"user_id" text NOT NULL,
	"parent_task_id" text,
	"completed_at" timestamp with time zone,
	"recurrence_rule" jsonb,
	"next_occurrence_date" timestamp with time zone,
	"estimated_minutes" integer,
	"actual_minutes" integer,
	"tags" jsonb,
	"custom_fields" jsonb,
	"position" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"organization_id" text,
	"team_id" text
);
--> statement-breakpoint
CREATE TABLE "magictodo_time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" text NOT NULL,
	"user_id" text NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone,
	"duration_seconds" integer,
	"description" text,
	"billable" boolean DEFAULT false,
	"hourly_rate" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"organization_id" text,
	"team_id" text
);
--> statement-breakpoint
ALTER TABLE "magictodo_focus_session_queue" ADD CONSTRAINT "magictodo_focus_session_queue_session_id_magictodo_focus_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."magictodo_focus_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magictodo_focus_session_queue" ADD CONSTRAINT "magictodo_focus_session_queue_task_id_magictodo_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."magictodo_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magictodo_focus_sessions" ADD CONSTRAINT "magictodo_focus_sessions_current_task_id_magictodo_tasks_id_fk" FOREIGN KEY ("current_task_id") REFERENCES "public"."magictodo_tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magictodo_snoozed_tasks" ADD CONSTRAINT "magictodo_snoozed_tasks_task_id_magictodo_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."magictodo_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magictodo_snoozed_tasks" ADD CONSTRAINT "magictodo_snoozed_tasks_dependency_task_id_magictodo_tasks_id_fk" FOREIGN KEY ("dependency_task_id") REFERENCES "public"."magictodo_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magictodo_task_comments" ADD CONSTRAINT "magictodo_task_comments_task_id_magictodo_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."magictodo_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magictodo_task_comments" ADD CONSTRAINT "magictodo_task_comments_parent_id_magictodo_task_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."magictodo_task_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magictodo_task_dependencies" ADD CONSTRAINT "magictodo_task_dependencies_task_id_magictodo_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."magictodo_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magictodo_task_dependencies" ADD CONSTRAINT "magictodo_task_dependencies_depends_on_task_id_magictodo_tasks_id_fk" FOREIGN KEY ("depends_on_task_id") REFERENCES "public"."magictodo_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magictodo_tasks" ADD CONSTRAINT "magictodo_tasks_project_id_magictodo_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."magictodo_projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magictodo_tasks" ADD CONSTRAINT "magictodo_tasks_parent_task_id_magictodo_tasks_id_fk" FOREIGN KEY ("parent_task_id") REFERENCES "public"."magictodo_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magictodo_time_entries" ADD CONSTRAINT "magictodo_time_entries_task_id_magictodo_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."magictodo_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "magictodo_focus_queue_session_idx" ON "magictodo_focus_session_queue" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "magictodo_focus_queue_task_idx" ON "magictodo_focus_session_queue" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "magictodo_focus_queue_session_position_idx" ON "magictodo_focus_session_queue" USING btree ("session_id","position");--> statement-breakpoint
CREATE INDEX "magictodo_focus_sessions_user_id_idx" ON "magictodo_focus_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "magictodo_focus_sessions_status_idx" ON "magictodo_focus_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "magictodo_focus_sessions_started_at_idx" ON "magictodo_focus_sessions" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "magictodo_projects_user_id_idx" ON "magictodo_projects" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "magictodo_projects_archived_idx" ON "magictodo_projects" USING btree ("archived");--> statement-breakpoint
CREATE INDEX "magictodo_snoozed_tasks_task_id_idx" ON "magictodo_snoozed_tasks" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "magictodo_snoozed_tasks_user_id_idx" ON "magictodo_snoozed_tasks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "magictodo_snoozed_tasks_snoozed_until_idx" ON "magictodo_snoozed_tasks" USING btree ("snoozed_until");--> statement-breakpoint
CREATE INDEX "magictodo_snoozed_tasks_dependency_task_id_idx" ON "magictodo_snoozed_tasks" USING btree ("dependency_task_id");--> statement-breakpoint
CREATE INDEX "magictodo_task_comments_task_id_idx" ON "magictodo_task_comments" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "magictodo_task_comments_user_id_idx" ON "magictodo_task_comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "magictodo_task_comments_parent_id_idx" ON "magictodo_task_comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "magictodo_task_comments_created_at_idx" ON "magictodo_task_comments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "magictodo_task_deps_task_idx" ON "magictodo_task_dependencies" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "magictodo_task_deps_depends_on_idx" ON "magictodo_task_dependencies" USING btree ("depends_on_task_id");--> statement-breakpoint
CREATE INDEX "magictodo_task_deps_unique_idx" ON "magictodo_task_dependencies" USING btree ("task_id","depends_on_task_id");--> statement-breakpoint
CREATE INDEX "magictodo_tasks_user_id_idx" ON "magictodo_tasks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "magictodo_tasks_project_id_idx" ON "magictodo_tasks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "magictodo_tasks_status_idx" ON "magictodo_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "magictodo_tasks_due_date_idx" ON "magictodo_tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "magictodo_tasks_parent_task_id_idx" ON "magictodo_tasks" USING btree ("parent_task_id");--> statement-breakpoint
CREATE INDEX "magictodo_time_entries_task_id_idx" ON "magictodo_time_entries" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "magictodo_time_entries_user_id_idx" ON "magictodo_time_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "magictodo_time_entries_start_time_idx" ON "magictodo_time_entries" USING btree ("start_time");