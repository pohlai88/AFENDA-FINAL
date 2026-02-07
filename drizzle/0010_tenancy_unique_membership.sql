-- Phase 6: Tenancy unique membership constraint
-- Prevents duplicate memberships: one user per (org) or per (standalone team) or per (org+team)

CREATE UNIQUE INDEX "tenancy_memberships_org_unique_idx" ON "tenancy_memberships" USING btree ("user_id", "organization_id") WHERE "organization_id" IS NOT NULL AND "team_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "tenancy_memberships_standalone_team_unique_idx" ON "tenancy_memberships" USING btree ("user_id", "team_id") WHERE "organization_id" IS NULL AND "team_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "tenancy_memberships_org_team_unique_idx" ON "tenancy_memberships" USING btree ("user_id", "organization_id", "team_id") WHERE "organization_id" IS NOT NULL AND "team_id" IS NOT NULL;
