ALTER TYPE "public"."magicdrive_status" ADD VALUE 'deleted';--> statement-breakpoint
CREATE TABLE "tenancy_memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"team_id" text,
	"role" text DEFAULT 'member' NOT NULL,
	"permissions" jsonb DEFAULT '{}'::jsonb,
	"invited_by" text,
	"joined_at" timestamp with time zone DEFAULT now(),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenancy_organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"logo" text,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenancy_teams" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"parent_id" text,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenancy_tenant_design_system" (
	"tenant_id" text PRIMARY KEY NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "magicdrive_collections" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "magicdrive_duplicate_groups" ADD COLUMN "keep_version_id" text;--> statement-breakpoint
ALTER TABLE "magicdrive_object_index" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "tenancy_memberships" ADD CONSTRAINT "tenancy_memberships_organization_id_tenancy_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."tenancy_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenancy_memberships" ADD CONSTRAINT "tenancy_memberships_team_id_tenancy_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."tenancy_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenancy_teams" ADD CONSTRAINT "tenancy_teams_organization_id_tenancy_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."tenancy_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenancy_teams" ADD CONSTRAINT "tenancy_teams_parent_id_tenancy_teams_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tenancy_teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tenancy_memberships_user_id_idx" ON "tenancy_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tenancy_memberships_organization_id_idx" ON "tenancy_memberships" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "tenancy_memberships_team_id_idx" ON "tenancy_memberships" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "tenancy_memberships_user_org_idx" ON "tenancy_memberships" USING btree ("user_id","organization_id","team_id");--> statement-breakpoint
CREATE INDEX "tenancy_memberships_is_active_idx" ON "tenancy_memberships" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "tenancy_organizations_slug_idx" ON "tenancy_organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "tenancy_organizations_created_by_idx" ON "tenancy_organizations" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "tenancy_organizations_is_active_idx" ON "tenancy_organizations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "tenancy_teams_organization_id_idx" ON "tenancy_teams" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tenancy_teams_org_slug_idx" ON "tenancy_teams" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE INDEX "tenancy_teams_parent_id_idx" ON "tenancy_teams" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "tenancy_teams_is_active_idx" ON "tenancy_teams" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "tenancy_tenant_design_system_tenant_id_idx" ON "tenancy_tenant_design_system" USING btree ("tenant_id");