import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { scheduledAt } = await request.json();

  if (!scheduledAt) {
    return NextResponse.json({ error: "scheduledAt is required" }, { status: 400 });
  }

  const checkIn = await prisma.checkIn.update({
    where: { id },
    data: { scheduledAt: new Date(scheduledAt) },
  });

  // Keep the schedule's nextCheckIn in sync
  await prisma.checkInSchedule.update({
    where: { contactId: checkIn.contactId },
    data: { nextCheckIn: new Date(scheduledAt) },
  }).catch(() => {});

  return NextResponse.json(checkIn);
}
