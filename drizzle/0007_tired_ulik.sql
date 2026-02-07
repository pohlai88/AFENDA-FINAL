CREATE TYPE "public"."magicdrive_doc_type" AS ENUM('pdf', 'image', 'document', 'spreadsheet', 'presentation', 'archive', 'video', 'audio', 'other');--> statement-breakpoint
CREATE TYPE "public"."magicdrive_dup_reason" AS ENUM('exact', 'near');--> statement-breakpoint
CREATE TYPE "public"."magicdrive_status" AS ENUM('inbox', 'processing', 'ready', 'archived', 'error');--> statement-breakpoint
CREATE TYPE "public"."magicdrive_upload_status" AS ENUM('presigned', 'uploaded', 'ingested', 'failed');--> statement-breakpoint
CREATE TABLE "magicdrive_collection_objects" (
	"collection_id" text NOT NULL,
	"object_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "magicdrive_collections" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text,
	"icon" text,
	"sort_order" integer DEFAULT 0,
	"is_smart_collection" boolean DEFAULT false,
	"smart_filter" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "magicdrive_duplicate_group_versions" (
	"group_id" text NOT NULL,
	"version_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "magicdrive_duplicate_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"reason" "magicdrive_dup_reason" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "magicdrive_object_index" (
	"id" text PRIMARY KEY NOT NULL,
	"object_id" text NOT NULL,
	"text_hash" text,
	"extracted_text" text,
	"extracted_fields" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "magicdrive_object_tags" (
	"object_id" text NOT NULL,
	"tag_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "magicdrive_object_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"object_id" text NOT NULL,
	"version_no" integer NOT NULL,
	"r2_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"sha256" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "magicdrive_objects" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"current_version_id" text,
	"title" text,
	"doc_type" "magicdrive_doc_type" DEFAULT 'other' NOT NULL,
	"status" "magicdrive_status" DEFAULT 'inbox' NOT NULL,
	"deleted_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "magicdrive_saved_views" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"filters" jsonb DEFAULT '{}'::jsonb,
	"view_mode" text DEFAULT 'cards',
	"sort_by" text DEFAULT 'createdAt',
	"sort_order" text DEFAULT 'desc',
	"is_public" boolean DEFAULT false,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "magicdrive_tags" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "magicdrive_tenant_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"document_types" jsonb DEFAULT '[]'::jsonb,
	"status_workflow" jsonb DEFAULT '[]'::jsonb,
	"enable_ai_suggestions" boolean DEFAULT false,
	"enable_public_shares" boolean DEFAULT false,
	"max_file_size_mb" integer DEFAULT 100,
	"allowed_file_types" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "magicdrive_tenant_settings_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE "magicdrive_uploads" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"object_id" text NOT NULL,
	"version_id" text NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"sha256" text NOT NULL,
	"r2_key_quarantine" text NOT NULL,
	"status" "magicdrive_upload_status" DEFAULT 'presigned' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "magicdrive_user_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"default_view" text DEFAULT 'cards',
	"items_per_page" integer DEFAULT 20,
	"default_sort" text,
	"show_file_extensions" boolean DEFAULT true,
	"show_thumbnails" boolean DEFAULT true,
	"compact_mode" boolean DEFAULT false,
	"quick_settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "magicdrive_collection_objects" ADD CONSTRAINT "magicdrive_collection_objects_collection_id_magicdrive_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."magicdrive_collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magicdrive_collection_objects" ADD CONSTRAINT "magicdrive_collection_objects_object_id_magicdrive_objects_id_fk" FOREIGN KEY ("object_id") REFERENCES "public"."magicdrive_objects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magicdrive_duplicate_group_versions" ADD CONSTRAINT "magicdrive_duplicate_group_versions_group_id_magicdrive_duplicate_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."magicdrive_duplicate_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magicdrive_object_index" ADD CONSTRAINT "magicdrive_object_index_object_id_magicdrive_objects_id_fk" FOREIGN KEY ("object_id") REFERENCES "public"."magicdrive_objects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magicdrive_object_tags" ADD CONSTRAINT "magicdrive_object_tags_object_id_magicdrive_objects_id_fk" FOREIGN KEY ("object_id") REFERENCES "public"."magicdrive_objects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magicdrive_object_tags" ADD CONSTRAINT "magicdrive_object_tags_tag_id_magicdrive_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."magicdrive_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magicdrive_object_versions" ADD CONSTRAINT "magicdrive_object_versions_object_id_magicdrive_objects_id_fk" FOREIGN KEY ("object_id") REFERENCES "public"."magicdrive_objects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "magicdrive_co_collection_object_idx" ON "magicdrive_collection_objects" USING btree ("collection_id","object_id");--> statement-breakpoint
CREATE INDEX "magicdrive_co_collection_id_idx" ON "magicdrive_collection_objects" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "magicdrive_co_object_id_idx" ON "magicdrive_collection_objects" USING btree ("object_id");--> statement-breakpoint
CREATE INDEX "magicdrive_collections_tenant_id_idx" ON "magicdrive_collections" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "magicdrive_dgv_group_version_idx" ON "magicdrive_duplicate_group_versions" USING btree ("group_id","version_id");--> statement-breakpoint
CREATE INDEX "magicdrive_dgv_group_id_idx" ON "magicdrive_duplicate_group_versions" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "magicdrive_duplicate_groups_tenant_id_idx" ON "magicdrive_duplicate_groups" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "magicdrive_object_index_object_id_idx" ON "magicdrive_object_index" USING btree ("object_id");--> statement-breakpoint
CREATE INDEX "magicdrive_object_index_text_hash_idx" ON "magicdrive_object_index" USING btree ("text_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "magicdrive_ot_object_tag_idx" ON "magicdrive_object_tags" USING btree ("object_id","tag_id");--> statement-breakpoint
CREATE INDEX "magicdrive_ot_object_id_idx" ON "magicdrive_object_tags" USING btree ("object_id");--> statement-breakpoint
CREATE INDEX "magicdrive_ot_tag_id_idx" ON "magicdrive_object_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "magicdrive_object_versions_object_id_idx" ON "magicdrive_object_versions" USING btree ("object_id");--> statement-breakpoint
CREATE INDEX "magicdrive_object_versions_sha256_idx" ON "magicdrive_object_versions" USING btree ("sha256");--> statement-breakpoint
CREATE INDEX "magicdrive_objects_tenant_id_idx" ON "magicdrive_objects" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "magicdrive_objects_status_idx" ON "magicdrive_objects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "magicdrive_objects_doc_type_idx" ON "magicdrive_objects" USING btree ("doc_type");--> statement-breakpoint
CREATE INDEX "magicdrive_saved_views_tenant_id_idx" ON "magicdrive_saved_views" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "magicdrive_saved_views_user_id_idx" ON "magicdrive_saved_views" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "magicdrive_tags_tenant_id_idx" ON "magicdrive_tags" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "magicdrive_tags_slug_idx" ON "magicdrive_tags" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "magicdrive_tenant_settings_tenant_id_idx" ON "magicdrive_tenant_settings" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "magicdrive_uploads_tenant_id_idx" ON "magicdrive_uploads" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "magicdrive_uploads_status_idx" ON "magicdrive_uploads" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "magicdrive_up_tenant_user_idx" ON "magicdrive_user_preferences" USING btree ("tenant_id","user_id");