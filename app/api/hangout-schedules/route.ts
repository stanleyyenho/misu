import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const schedules = await prisma.checkInSchedule.findMany({
    where: {
      contact: { userId: user.id },
      isActive: true,
      scheduleType: "hangout",
    },
    select: {
      id: true,
      contactId: true,
      frequencyDays: true,
      nextCheckIn: true,
      cadenceMode: true,
      hangoutType: true,
      leadTimeDays: true,
      defaultHangout: true,
      noteToFriend: true,
      tone: true,
      approveBeforeSend: true,
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          messagingPlatform: true,
        },
      },
    },
    orderBy: { nextCheckIn: "asc" },
  });

  return NextResponse.json(schedules);
}
