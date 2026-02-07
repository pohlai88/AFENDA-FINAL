CREATE TABLE "orchestra_custom_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"icon" text DEFAULT 'IconSettings' NOT NULL,
	"configs" jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"version" text DEFAULT '1.0.0',
	"tags" jsonb,
	"created_by" text,
	"updated_by" text,
	"archived_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"applied_count" text DEFAULT '0',
	"last_applied_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "orchestra_template_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"version" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"change_type" text NOT NULL,
	"changed_by" text,
	"change_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "orchestra_custom_templates_status_idx" ON "orchestra_custom_templates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orchestra_custom_templates_category_idx" ON "orchestra_custom_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "orchestra_custom_templates_created_by_idx" ON "orchestra_custom_templates" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "orchestra_custom_templates_updated_idx" ON "orchestra_custom_templates" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "orchestra_custom_templates_name_idx" ON "orchestra_custom_templates" USING btree ("name");--> statement-breakpoint
CREATE INDEX "orchestra_template_history_template_idx" ON "orchestra_template_history" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "orchestra_template_history_created_idx" ON "orchestra_template_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orchestra_template_history_changed_by_idx" ON "orchestra_template_history" USING btree ("changed_by");