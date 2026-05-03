import { NextResponse } from "next/server";
import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: contactId } = await params;
  const owned = await prisma.contact.findFirst({ where: { id: contactId, userId: user.id } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const {
    frequencyDays,
    tone = "casual",
    checkInType = "generic",
    approveBeforeSend = true,
  } = body;

  if (!frequencyDays) {
    return NextResponse.json({ error: "frequencyDays is required" }, { status: 400 });
  }

  const nextCheckIn = addDays(new Date(), frequencyDays);

  const schedule = await prisma.checkInSchedule.upsert({
    where: { contactId },
    create: {
      contactId,
      frequencyDays,
      catchupFormats: "[]",
      tone,
      checkInType,
      approveBeforeSend,
      nextCheckIn,
      isActive: true,
    },
    update: {
      frequencyDays,
      tone,
      checkInType,
      approveBeforeSend,
      nextCheckIn,
      isActive: true,
    },
  });

  // Replace any pending check-in with the new schedule
  await prisma.checkIn.deleteMany({ where: { contactId, status: "pending" } });
  await prisma.checkIn.create({
    data: { contactId, scheduledAt: nextCheckIn, status: "pending" },
  });

  return NextResponse.json(schedule);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: contactId } = await params;
  const owned = await prisma.contact.findFirst({ where: { id: contactId, userId: user.id } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.checkInSchedule.update({
    where: { contactId },
    data: { isActive: false },
  });

  await prisma.checkIn.deleteMany({ where: { contactId, status: "pending" } });

  return NextResponse.json({ success: true });
}
