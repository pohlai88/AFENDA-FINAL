CREATE TABLE "orchestra_backup_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"backup_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"event_message" text,
	"event_details" jsonb,
	"actor_id" text,
	"trace_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orchestra_backups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filename" text NOT NULL,
	"storage_location" text NOT NULL,
	"storage_provider" text NOT NULL,
	"backup_type" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"checksum" text NOT NULL,
	"status" text NOT NULL,
	"encrypted" boolean DEFAULT true NOT NULL,
	"encryption_algorithm" text DEFAULT 'aes-256-gcm',
	"encryption_key_version" text DEFAULT '1',
	"includes_database" boolean DEFAULT true,
	"includes_r2_bucket" boolean DEFAULT false,
	"includes_services" jsonb,
	"local_fallback_path" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"metadata" jsonb,
	"error_message" text,
	"error_details" jsonb
);
--> statement-breakpoint
ALTER TABLE "orchestra_backup_history" ADD CONSTRAINT "orchestra_backup_history_backup_id_orchestra_backups_id_fk" FOREIGN KEY ("backup_id") REFERENCES "public"."orchestra_backups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orchestra_backup_history_backup_id_idx" ON "orchestra_backup_history" USING btree ("backup_id");--> statement-breakpoint
CREATE INDEX "orchestra_backup_history_event_type_idx" ON "orchestra_backup_history" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "orchestra_backup_history_created_at_idx" ON "orchestra_backup_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orchestra_backups_status_idx" ON "orchestra_backups" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orchestra_backups_created_at_idx" ON "orchestra_backups" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orchestra_backups_created_by_idx" ON "orchestra_backups" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "orchestra_backups_storage_provider_idx" ON "orchestra_backups" USING btree ("storage_provider");--> statement-breakpoint
CREATE INDEX "orchestra_backups_backup_type_idx" ON "orchestra_backups" USING btree ("backup_type");