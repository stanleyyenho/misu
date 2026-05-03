import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use process.env directly (not env()) so prisma generate doesn't throw
    // when DATABASE_URL is absent at install time (e.g. Vercel postinstall).
    url: process.env.DATABASE_URL ?? "",
    // directUrl: process.env.DIRECT_URL ?? "",
  },
});
