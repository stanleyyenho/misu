import { NextResponse } from "next/server";
import { endOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/webpush";
import { seedPendingReminders, fireDueReminders } from "@/lib/hangout-reminders";
import { processCadenceModes } from "@/lib/cadence-modes";

// Called daily by Vercel Cron (see vercel.json) or any external cron service.
// Protect with a secret so random people can't trigger it.
export async function GET(request: Request) {
  const headerSecret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const querySecret = new URL(request.url).searchParams.get("secret");
  const provided = headerSecret || querySecret;

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || provided !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dueToday = await prisma.checkIn.findMany({
    where: {
      status: "pending",
      scheduledAt: { lte: endOfDay(new Date()) },
    },
    select: {
      contactId: true,
      contact: { select: { userId: true, firstName: true, lastName: true } },
    },
  });

  for (const checkIn of dueToday) {
    const name = [checkIn.contact.firstName, checkIn.contact.lastName].filter(Boolean).join(" ");
    await sendPushToUser(checkIn.contact.userId, {
      title: `Time to check in with ${name}`,
      body: "Tap to open Misu and log your catch-up",
      url: `/contacts/${checkIn.contactId}`,
    });
  }

  const pastHangouts = await prisma.hangout.findMany({
    where: {
      status: { in: ["confirmed", "invited"] },
      date: { lt: new Date() },
    },
    select: {
      userId: true,
      contactId: true,
      contact: { select: { firstName: true, lastName: true } },
    },
  });

  for (const h of pastHangouts) {
    const name = [h.contact.firstName, h.contact.lastName].filter(Boolean).join(" ");
    await sendPushToUser(h.userId, {
      title: `Did you hang out with ${name}?`,
      body: "Tap to mark it done or skip it.",
      url: `/contacts/${h.contactId}`,
    });
  }

  const cadenceResult = await processCadenceModes();
  const seeded = await seedPendingReminders();
  const remindersFired = await fireDueReminders();

  return NextResponse.json({
    checkInsSent: dueToday.length,
    completionPromptsSent: pastHangouts.length,
    ...cadenceResult,
    remindersSeeded: seeded,
    remindersFired,
  });
}
