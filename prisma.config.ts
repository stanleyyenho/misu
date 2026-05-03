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
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/placeholder",
  },
});
