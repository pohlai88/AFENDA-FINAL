CREATE TABLE "orchestra_app_domains" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"href" text NOT NULL,
	"icon" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "orchestra_app_domains_enabled_idx" ON "orchestra_app_domains" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "orchestra_app_domains_sort_order_idx" ON "orchestra_app_domains" USING btree ("sort_order");--> statement-breakpoint
INSERT INTO "orchestra_app_domains" ("id", "label", "href", "icon", "sort_order", "enabled", "description") VALUES
  ('system', 'System', '/dashboard', 'dashboard', 0, true, 'Dashboard and administration'),
  ('magictodo', 'MagicTodo', '/magictodo', 'checklist', 1, true, 'Task management'),
  ('magicdrive', 'MagicDrive', '/magicfolder', 'folder', 2, true, 'Documents and files');