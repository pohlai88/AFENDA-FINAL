CREATE TABLE "orchestra_admin_config" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "orchestra_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"actor_id" text,
	"actor_type" text DEFAULT 'system',
	"details" jsonb,
	"previous_values" jsonb,
	"ip_address" text,
	"user_agent" text,
	"trace_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orchestra_service_registry" (
	"id" text PRIMARY KEY NOT NULL,
	"endpoint" text NOT NULL,
	"health_check" text NOT NULL,
	"description" text,
	"version" text,
	"tags" jsonb,
	"status" text DEFAULT 'registered' NOT NULL,
	"last_health_check" timestamp with time zone,
	"last_health_latency_ms" integer,
	"last_health_error" text,
	"registered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "orchestra_admin_config_updated_idx" ON "orchestra_admin_config" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "orchestra_audit_log_event_type_idx" ON "orchestra_audit_log" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "orchestra_audit_log_entity_idx" ON "orchestra_audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "orchestra_audit_log_actor_idx" ON "orchestra_audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "orchestra_audit_log_created_idx" ON "orchestra_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orchestra_audit_log_trace_idx" ON "orchestra_audit_log" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "orchestra_service_registry_status_idx" ON "orchestra_service_registry" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orchestra_service_registry_updated_idx" ON "orchestra_service_registry" USING btree ("updated_at");