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
    frequencyJitterDays = 0,
    tone = "casual",
    checkInType = "generic",
    approveBeforeSend = true,
    hangoutType = "in-person",
    cadenceMode = "prompt",
    leadTimeDays = 7,
    defaultHangout = null,
    noteToFriend = null,
  } = body;

  if (!frequencyDays) {
    return NextResponse.json({ error: "frequencyDays is required" }, { status: 400 });
  }

  const jitter = Math.min(Number(frequencyJitterDays), Math.floor(Number(frequencyDays) / 2));
  const jitterOffset = jitter > 0 ? Math.floor(Math.random() * (jitter * 2 + 1)) - jitter : 0;
  const nextCheckIn = addDays(new Date(), Number(frequencyDays) + jitterOffset);

  const schedule = await prisma.checkInSchedule.upsert({
    where: { contactId },
    create: {
      contactId,
      frequencyDays,
      frequencyJitterDays: jitter,
      catchupFormats: "[]",
      tone,
      checkInType,
      approveBeforeSend,
      nextCheckIn,
      isActive: true,
      hangoutType,
      cadenceMode,
      leadTimeDays: Number(leadTimeDays),
      defaultHangout: defaultHangout ? JSON.stringify(defaultHangout) : null,
      noteToFriend: noteToFriend || null,
    },
    update: {
      frequencyDays,
      frequencyJitterDays: jitter,
      tone,
      checkInType,
      approveBeforeSend,
      nextCheckIn,
      isActive: true,
      hangoutType,
      cadenceMode,
      leadTimeDays: Number(leadTimeDays),
      defaultHangout: defaultHangout ? JSON.stringify(defaultHangout) : null,
      noteToFriend: noteToFriend || null,
    },
  });

  // Replace any pending check-in with the new schedule
  await prisma.checkIn.deleteMany({ where: { contactId, status: "pending" } });
  await prisma.checkIn.create({
    data: { contactId, scheduledAt: nextCheckIn, status: "pending" },
  });

  return NextResponse.json(schedule);
}

// PATCH: update only nextCheckIn (raincheck flow)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: contactId } = await params;
  const owned = await prisma.contact.findFirst({ where: { id: contactId, userId: user.id } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { nextCheckIn } = await request.json();
  if (!nextCheckIn) return NextResponse.json({ error: "nextCheckIn is required" }, { status: 400 });

  const date = new Date(nextCheckIn);
  if (isNaN(date.getTime())) return NextResponse.json({ error: "Invalid date" }, { status: 400 });

  const schedule = await prisma.checkInSchedule.update({
    where: { contactId },
    data: { nextCheckIn: date },
  });

  // Update the pending check-in to match
  await prisma.checkIn.deleteMany({ where: { contactId, status: "pending" } });
  await prisma.checkIn.create({ data: { contactId, scheduledAt: date, status: "pending" } });

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
