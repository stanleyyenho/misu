import { NextResponse } from "next/server";
import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contactId } = await params;
  const body = await request.json();
  const { frequencyDays, catchupFormats } = body;

  if (!frequencyDays || !Array.isArray(catchupFormats)) {
    return NextResponse.json(
      { error: "frequencyDays and catchupFormats are required" },
      { status: 400 }
    );
  }

  const nextCheckIn = addDays(new Date(), frequencyDays);

  const schedule = await prisma.checkInSchedule.upsert({
    where: { contactId },
    create: {
      contactId,
      frequencyDays,
      catchupFormats: JSON.stringify(catchupFormats),
      nextCheckIn,
      isActive: true,
    },
    update: {
      frequencyDays,
      catchupFormats: JSON.stringify(catchupFormats),
      nextCheckIn,
      isActive: true,
    },
  });

  // Delete any existing pending check-ins and create a fresh one
  await prisma.checkIn.deleteMany({
    where: { contactId, status: "pending" },
  });

  await prisma.checkIn.create({
    data: { contactId, scheduledAt: nextCheckIn, status: "pending" },
  });

  return NextResponse.json(schedule);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contactId } = await params;

  await prisma.checkInSchedule.update({
    where: { contactId },
    data: { isActive: false },
  });

  await prisma.checkIn.deleteMany({
    where: { contactId, status: "pending" },
  });

  return NextResponse.json({ success: true });
}
