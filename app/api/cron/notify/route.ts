import { NextResponse } from "next/server";
import { endOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { sendPushToAll } from "@/lib/webpush";
import { seedPendingReminders, fireDueReminders } from "@/lib/hangout-reminders";
import { processCadenceModes } from "@/lib/cadence-modes";

// Called daily by Vercel Cron (see vercel.json) or any external cron service.
// Protect with a secret so random people can't trigger it.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || secret !== cronSecret) {
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

  // Post-hangout completion prompts
  const pastHangouts = await prisma.hangout.findMany({
    where: {
      status: { in: ["confirmed", "invited"] },
      date: { lt: new Date() },
    },
    include: { contact: { select: { firstName: true, lastName: true, id: true } } },
  });

  for (const h of pastHangouts) {
    const name = [h.contact.firstName, h.contact.lastName].filter(Boolean).join(" ");
    await sendPushToAll({
      title: `Did you hang out with ${name}?`,
      body: "Tap to mark it done or skip it.",
      url: `/contacts/${h.contactId}`,
    });
  }

  // Cadence mode triggers (prompt / perpetual / planned)
  const cadenceResult = await processCadenceModes();

  // Hangout reminders
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
