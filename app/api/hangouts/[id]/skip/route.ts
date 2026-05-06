import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeJitteredNextDate } from "@/lib/scheduling";
import { getUser } from "@/lib/supabase/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const hangout = await prisma.hangout.findFirst({ where: { id, userId: user.id } });
  if (!hangout) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();
  // Find the hangout-specific schedule (not the check-in message schedule)
  const hangoutSchedule = await prisma.checkInSchedule.findFirst({
    where: { contactId: hangout.contactId, scheduleType: "hangout" },
  });

  await prisma.$transaction(async (tx) => {
    await tx.hangout.update({ where: { id }, data: { status: "skipped" } });
    await tx.checkIn.create({
      data: { contactId: hangout.contactId, scheduledAt: hangout.date, status: "skipped" },
    });

    // Advance the hangout schedule's next date.
    // Check-in message pending rows are managed independently — don't touch them.
    if (hangoutSchedule?.isActive) {
      const nextCheckIn = computeJitteredNextDate(hangoutSchedule, now);
      await tx.checkInSchedule.update({
        where: { id: hangoutSchedule.id },
        data: { lastCheckIn: now, nextCheckIn },
      });
    }
  });

  return NextResponse.json({ success: true });
}
