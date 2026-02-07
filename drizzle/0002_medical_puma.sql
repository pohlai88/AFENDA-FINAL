ALTER TABLE "orchestra_service_registry" ADD COLUMN "owner_contact" text;--> statement-breakpoint
ALTER TABLE "orchestra_service_registry" ADD COLUMN "documentation_url" text;--> statement-breakpoint
ALTER TABLE "orchestra_service_registry" ADD COLUMN "health_check_interval_ms" integer DEFAULT 30000;--> statement-breakpoint
ALTER TABLE "orchestra_service_registry" ADD COLUMN "health_check_timeout_ms" integer DEFAULT 5000;