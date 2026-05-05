import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Twilio sends form-encoded POST bodies
export async function POST(request: Request) {
  const body = await request.text();
  const params = new URLSearchParams(body);

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
