import { NextResponse } from "next/server";
import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const hangout = await prisma.hangout.findFirst({
    where: { id, userId: user.id },
  });
  if (!hangout) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();

  await prisma.hangout.update({ where: { id }, data: { status: "skipped" } });

  await prisma.checkIn.create({
    data: {
      contactId: hangout.contactId,
      scheduledAt: hangout.date,
      status: "skipped",
    },
  });

  // Reset cadence clock from today (doesn't stack)
  const schedule = await prisma.checkInSchedule.findUnique({
    where: { contactId: hangout.contactId },
  });
  if (schedule?.isActive) {
    const jitter = schedule.frequencyJitterDays ?? 0;
    const jitterOffset = jitter > 0 ? Math.floor(Math.random() * (jitter * 2 + 1)) - jitter : 0;
    const nextCheckIn = addDays(now, schedule.frequencyDays + jitterOffset);

    await prisma.checkInSchedule.update({
      where: { contactId: hangout.contactId },
      data: { lastCheckIn: now, nextCheckIn },
    });

    await prisma.checkIn.deleteMany({ where: { contactId: hangout.contactId, status: "pending" } });
    await prisma.checkIn.create({
      data: { contactId: hangout.contactId, scheduledAt: nextCheckIn, status: "pending" },
    });
  }

  return NextResponse.json({ success: true });
}
