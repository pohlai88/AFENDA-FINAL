-- Phase 1: Tenancy standalone teams (per Tenancy Principles plan)
-- Makes organizationId nullable on teams and memberships; adds partial unique indexes and check constraint

ALTER TABLE "tenancy_teams" ALTER COLUMN "organization_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tenancy_memberships" ALTER COLUMN "organization_id" DROP NOT NULL;--> statement-breakpoint
DROP INDEX IF EXISTS "tenancy_teams_org_slug_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "tenancy_teams_standalone_slug_idx" ON "tenancy_teams" USING btree ("slug") WHERE "organization_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "tenancy_teams_org_slug_idx" ON "tenancy_teams" USING btree ("organization_id","slug") WHERE "organization_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "tenancy_memberships" ADD CONSTRAINT "tenancy_memberships_org_or_team_check" CHECK ("organization_id" IS NOT NULL OR "team_id" IS NOT NULL);--> statement-breakpoint
