import { NextResponse } from "next/server";
import { endOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { sendPushToAll } from "@/lib/webpush";

// Called daily by Vercel Cron (see vercel.json) or any external cron service.
// Protect with a secret so random people can't trigger it.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (
    process.env.CRON_SECRET &&
    secret !== process.env.CRON_SECRET
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dueToday = await prisma.checkIn.findMany({
    where: {
      status: "pending",
      scheduledAt: { lte: endOfDay(new Date()) },
    },
    include: { contact: true },
  });

  for (const checkIn of dueToday) {
    const name = [checkIn.contact.firstName, checkIn.contact.lastName]
      .filter(Boolean)
      .join(" ");
    await sendPushToAll({
      title: `Time to check in with ${name}`,
      body: "Tap to open Misu and log your catch-up",
      url: `/contacts/${checkIn.contactId}`,
    });
  }

  return NextResponse.json({ sent: dueToday.length });
}
