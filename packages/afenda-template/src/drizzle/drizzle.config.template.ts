import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit config template (Neon + RLS Roles).
 *
 * Note: roles are not managed by default.
 * To manage/track roles and avoid Neon predefined roles in diffs:
 * entities.roles.provider = 'neon'
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/drizzle/afenda.schema.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  entities: {
    roles: {
      provider: "neon",
    },
  },
});
