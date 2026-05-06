import { NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";

// Twilio sends form-encoded POST bodies
export async function POST(request: Request) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const signature = request.headers.get("x-twilio-signature");
  const body = await request.text();
  const params = new URLSearchParams(body);

  // Twilio signs the full request URL plus the sorted POST params.
  // Behind a proxy, request.url may show the internal host; trust the
  // Forwarded/X-Forwarded-* headers that Vercel and most platforms set.
  const proto = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const path = new URL(request.url).pathname + new URL(request.url).search;
  const fullUrl = `${proto}://${host}${path}`;

  const paramObject = Object.fromEntries(params);
  if (!signature || !twilio.validateRequest(authToken, signature, fullUrl, paramObject)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const from = params.get("From");    // contact's phone number
  const rawBody = (params.get("Body") ?? "").trim();

  if (!from || !rawBody) {
    return new NextResponse("<Response/>", { headers: { "Content-Type": "text/xml" } });
  }

  // Find the most recent invited hangout for this phone number
  const contact = await prisma.contact.findFirst({
    where: { phone: from },
    include: {
      hangouts: {
        where: { status: "invited" },
        orderBy: { date: "asc" },
        take: 1,
      },
    },
  });

  const hangout = contact?.hangouts?.[0];

  if (!hangout) {
    // No pending hangout for this number — ignore silently
    return new NextResponse("<Response/>", { headers: { "Content-Type": "text/xml" } });
  }

  const normalized = rawBody.toUpperCase();
  let newStatus: string;

  if (normalized === "YES" || normalized === "Y" || normalized === "ACCEPT") {
    newStatus = "confirmed";
  } else if (normalized === "NO" || normalized === "N" || normalized === "DECLINE") {
    newStatus = "declined";
  } else {
    // Counter-propose or anything else — relay raw text
    newStatus = "counter";
  }

  await prisma.hangout.update({
    where: { id: hangout.id },
    data: {
      status: newStatus,
      // Store counter-propose text in noteToFriend temporarily so the user can see it
      ...(newStatus === "counter" ? { noteToFriend: `Counter: ${rawBody}` } : {}),
    },
  });

  // Twilio expects a TwiML response — empty is fine, no reply needed
  return new NextResponse("<Response/>", { headers: { "Content-Type": "text/xml" } });
}
