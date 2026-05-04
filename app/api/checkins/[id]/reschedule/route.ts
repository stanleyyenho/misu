import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.checkIn.findFirst({
    where: { id, contact: { userId: user.id } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

  revalidateTag("checkins", "max");
  return NextResponse.json(checkIn);
}
