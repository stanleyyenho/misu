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

  const normalized = rawBody.toUpperCase();
  const STOP_KEYWORDS = ["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"];
  const START_KEYWORDS = ["START", "UNSTOP", "YES"]; // YES also doubles as RSVP — see below
  const HELP_KEYWORDS = ["HELP", "INFO"];

  // STOP / HELP must be handled regardless of whether a hangout is pending.
  // Twilio's Messaging Service auto-replies to STOP/HELP; we mirror the state in our DB.
  if (STOP_KEYWORDS.includes(normalized)) {
    await prisma.contact.updateMany({
      where: { phone: from },
      data: { smsOptOutAt: new Date() },
    });
    return new NextResponse("<Response/>", { headers: { "Content-Type": "text/xml" } });
  }

  if (HELP_KEYWORDS.includes(normalized)) {
    return new NextResponse(
      `<Response><Message>Misu: Hangout invites &amp; reminders. Reply YES to confirm, NO to decline, STOP to opt out. Help: misu.app/marketing/terms</Message></Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
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

  // START re-opts-in even if there's no pending hangout
  if (normalized === "START" || normalized === "UNSTOP") {
    if (contact) {
      await prisma.contact.update({ where: { id: contact.id }, data: { smsOptOutAt: null } });
    }
    return new NextResponse("<Response/>", { headers: { "Content-Type": "text/xml" } });
  }

  const hangout = contact?.hangouts?.[0];

  if (!hangout) {
    // No pending hangout for this number — ignore silently
    return new NextResponse("<Response/>", { headers: { "Content-Type": "text/xml" } });
  }

  let newStatus: string;

  if (START_KEYWORDS.includes(normalized) || normalized === "Y" || normalized === "ACCEPT") {
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
