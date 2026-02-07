import { defineConfig } from "drizzle-kit"
import { loadEnvConfig } from "@next/env"

loadEnvConfig(process.cwd())

export default defineConfig({
  schema: [
    "./packages/shared/src/drizzle/index.ts",
    "./packages/orchestra/src/drizzle/orchestra.schema.ts",
    "./packages/magictodo/src/drizzle/magictodo.schema.ts",
    "./packages/magicdrive/src/drizzle/magicdrive.schema.ts",
    "./packages/tenancy/src/drizzle/tenancy.schema.ts"
  ],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: (() => {
      // Use an admin/owner connection for migrations (DDL), while allowing runtime to use
      // a restricted role (e.g. `app_user`) for RLS enforcement.
      const url = process.env.DATABASE_URL_MIGRATIONS ?? process.env.DATABASE_URL
      if (!url) {
        throw new Error(
          "DATABASE_URL_MIGRATIONS (preferred) or DATABASE_URL is required for drizzle-kit. Set in .env."
        )
      }
      return url
    })(),
  },
  // Keep `push` non-interactive by default.
  strict: false,
})

