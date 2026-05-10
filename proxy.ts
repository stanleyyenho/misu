import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Strip any spoofed downstream-trust headers from incoming requests before we
  // get a chance to set them ourselves. Anything an external client sends in
  // these headers MUST be ignored — only the values we set after validating the
  // JWT below can be trusted.
  request.headers.delete("x-misu-user-id");
  request.headers.delete("x-misu-user-email");
  request.headers.delete("x-misu-user-phone");

  // Capture cookies the Supabase SSR client wants to refresh; we'll apply them
  // to the final response after we know what user this request is for.
  const cookiesToApply: { name: string; value: string; options?: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToApply.push(...cookies);
        },
      },
    }
  );

  // Refresh session — MUST call getUser(), not getSession(), to avoid stale JWTs
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Forward validated identity to downstream RSC + route handlers via request
  // headers so they don't have to round-trip to Supabase to re-validate.
  if (user) {
    request.headers.set("x-misu-user-id", user.id);
    if (user.email) request.headers.set("x-misu-user-email", user.email);
    if (user.phone) request.headers.set("x-misu-user-phone", user.phone);
  }

  const supabaseResponse = NextResponse.next({ request });
  cookiesToApply.forEach(({ name, value, options }) =>
    supabaseResponse.cookies.set(name, value, options),
  );

  const { pathname } = request.nextUrl;

  // Serve marketing homepage on misu.care (root domain)
  const host = request.headers.get("host") ?? "";
  const isMarketingDomain =
    host === "misu.care" || host === "www.misu.care";

  if (isMarketingDomain) {
    // Pages served directly on misu.care — rewrite to /marketing/* routes
    const marketingPaths: Record<string, string> = {
      "/": "/marketing",
      "": "/marketing",
      "/privacy": "/marketing/privacy",
      "/terms": "/marketing/terms",
    };

    if (pathname in marketingPaths) {
      const url = request.nextUrl.clone();
      url.pathname = marketingPaths[pathname];
      return NextResponse.rewrite(url);
    }

    // All other paths on misu.care redirect to app.misu.care
    return NextResponse.redirect(`https://app.misu.care${pathname}`);
  }

  // Allow unauthenticated access to login, auth callback, and public assets
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/marketing") || // marketing site + privacy/terms pages
    pathname.startsWith("/api/calendar/") || // public iCal URLs
    pathname.startsWith("/api/notifications/vapid-public-key") ||
    pathname.startsWith("/api/cron/") ||
    pathname.startsWith("/api/webhooks/"); // Twilio and other inbound webhooks

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-.*\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
