import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // prisma/config's env() throws at load time if the var is missing, which breaks
    // `prisma generate` during Vercel's install step. Use process.env with a fallback
    // so generate succeeds at build time; the real URL is always present at runtime.
    // Prefer DIRECT_URL for CLI commands (migrate, db push). Supabase's pooler
    // (port 6543, pgbouncer) breaks Prisma's migration advisory locks, so
    // migrations must run against a direct connection (port 5432). Runtime
    // PrismaClient still uses DATABASE_URL via the pg adapter.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "postgresql://localhost:5432/placeholder",
  },
});
