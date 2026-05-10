import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { requireEnv } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — cookies can't be mutated here.
            // The middleware handles session refresh, so this is safe to ignore.
          }
        },
      },
    }
  );
}

// Minimal user shape — every call site only consumes id/email/phone.
type AppUser = { id: string; email: string | null; phone: string | null };

/**
 * Resolve the authenticated user for the current request.
 *
 * Wrapped in React's `cache()` so any RSC + route handler that calls this
 * multiple times in a single request only pays the cost once.
 *
 * Fast path: middleware (`proxy.ts`) already validates the JWT via
 * `supabase.auth.getUser()` on every request and forwards the validated
 * identity via `x-misu-user-*` request headers. Trusting those headers here
 * saves a second round-trip to Supabase auth on every API call (~100–300ms).
 *
 * Slow fallback: if the headers are missing (cron jobs, webhooks, anything
 * skipping middleware), revalidate against Supabase directly.
 */
export const getUser = cache(async (): Promise<AppUser | null> => {
  const h = await headers();
  const id = h.get("x-misu-user-id");
  if (id) {
    return {
      id,
      email: h.get("x-misu-user-email"),
      phone: h.get("x-misu-user-phone"),
    };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email ?? null, phone: user.phone ?? null };
});
