import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
    // directUrl is used by Prisma migrations to bypass the connection pooler (Supabase PgBouncer)
    // Uncomment and set DIRECT_URL in .env.local when running migrations
    // directUrl: env("DIRECT_URL"),
  },
});
