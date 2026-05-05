import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — MUST call getUser(), not getSession(), to avoid stale JWTs
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
