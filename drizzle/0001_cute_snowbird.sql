CREATE TABLE "orchestra_backup_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"cron_expression" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"backup_type" text DEFAULT 'full' NOT NULL,
	"retention_days" integer DEFAULT 30 NOT NULL,
	"last_run" timestamp with time zone,
	"next_run" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orchestra_config_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"config_key" text NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb,
	"changed_by" text,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orchestra_health_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" text NOT NULL,
	"status" text NOT NULL,
	"latency_ms" integer,
	"error_message" text,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "orchestra_backup_schedule_enabled_idx" ON "orchestra_backup_schedule" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "orchestra_backup_schedule_next_run_idx" ON "orchestra_backup_schedule" USING btree ("next_run");--> statement-breakpoint
CREATE INDEX "orchestra_backup_schedule_created_by_idx" ON "orchestra_backup_schedule" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "orchestra_config_history_key_idx" ON "orchestra_config_history" USING btree ("config_key");--> statement-breakpoint
CREATE INDEX "orchestra_config_history_changed_at_idx" ON "orchestra_config_history" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX "orchestra_config_history_changed_by_idx" ON "orchestra_config_history" USING btree ("changed_by");--> statement-breakpoint
CREATE INDEX "orchestra_health_history_service_idx" ON "orchestra_health_history" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "orchestra_health_history_recorded_idx" ON "orchestra_health_history" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "orchestra_health_history_status_idx" ON "orchestra_health_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orchestra_health_history_service_time_idx" ON "orchestra_health_history" USING btree ("service_id","recorded_at");