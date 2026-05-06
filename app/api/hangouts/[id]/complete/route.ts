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
  const schedule = await prisma.checkInSchedule.findUnique({
    where: { contactId: hangout.contactId },
  });

  const result = await prisma.$transaction(async (tx) => {
    await tx.hangout.update({ where: { id }, data: { status: "completed" } });

    const checkIn = await tx.checkIn.create({
      data: {
        contactId: hangout.contactId,
        scheduledAt: hangout.date,
        completedAt: now,
        format: hangout.type,
        status: "completed",
      },
    });

    if (hangout.checkInId) {
      await tx.checkIn.update({
        where: { id: hangout.checkInId },
        data: { status: "completed", completedAt: now },
      });
    }

    if (schedule?.isActive) {
      const nextCheckIn = computeJitteredNextDate(schedule, now);
      await tx.checkInSchedule.update({
        where: { contactId: hangout.contactId },
        data: { lastCheckIn: now, nextCheckIn },
      });
      await tx.checkIn.deleteMany({ where: { contactId: hangout.contactId, status: "pending" } });
      await tx.checkIn.create({
        data: { contactId: hangout.contactId, scheduledAt: nextCheckIn, status: "pending" },
      });
    }

    return checkIn;
  });

  return NextResponse.json({ success: true, checkInId: result.id });
}
