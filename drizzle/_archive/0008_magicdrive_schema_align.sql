-- Align DB with TypeScript schema (keep_version_id, owner_id, updated_at, status 'deleted')
-- Generated for typecheck/build alignment. Run with: pnpm db:migrate (or your migration runner)

ALTER TABLE "magicdrive_duplicate_groups" ADD COLUMN IF NOT EXISTS "keep_version_id" text;--> statement-breakpoint
ALTER TABLE "magicdrive_collections" ADD COLUMN IF NOT EXISTS "owner_id" text;--> statement-breakpoint
ALTER TABLE "magicdrive_object_index" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
-- Add 'deleted' to status enum (skip if already present: run DO block or add manually)
ALTER TYPE "magicdrive_status" ADD VALUE 'deleted';
