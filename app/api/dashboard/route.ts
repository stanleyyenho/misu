import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const now = new Date();

    const [
      recurringSchedules,
      upcoming,
      oneTimeHangouts,
      awaitingCompletion,
      recent,
      profile,
    ] = await Promise.all([
      // Recurring hangout schedules (cadenceMode != prompt)
      prisma.checkInSchedule.findMany({
        where: {
          contact: { userId: user.id },
          isActive: true,
          cadenceMode: { not: "prompt" },
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
      }),

      // Pending check-in messages (cadenceMode = prompt) — all, no date cap
      prisma.checkIn.findMany({
        where: {
          contact: { userId: user.id },
          status: "pending",
        },
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              messagingPlatform: true,
              notes: true,
              schedule: {
                select: {
                  tone: true,
                  checkInType: true,
                  approveBeforeSend: true,
                  frequencyDays: true,
                  cadenceMode: true,
                },
              },
            },
          },
        },
        orderBy: { scheduledAt: "asc" },
      }),

      // One-time upcoming hangouts (no schedule link)
      prisma.hangout.findMany({
        where: {
          userId: user.id,
          checkInId: null,
          status: { in: ["draft", "invited", "confirmed"] },
          date: { gte: now },
        },
        select: {
          id: true,
          type: true,
          status: true,
          date: true,
          locationName: true,
          locationAddr: true,
          platform: true,
          meetingLink: true,
          noteToFriend: true,
          checkInId: true,
          contact: { select: { id: true, firstName: true, lastName: true, phone: true } },
        },
        orderBy: { date: "asc" },
        take: 10,
      }),

      // Past hangouts awaiting completion
      prisma.hangout.findMany({
        where: {
          userId: user.id,
          status: { in: ["confirmed", "invited"] },
          date: { lt: now },
        },
        select: {
          id: true,
          type: true,
          status: true,
          date: true,
          locationName: true,
          locationAddr: true,
          platform: true,
          meetingLink: true,
          noteToFriend: true,
          checkInId: true,
          contact: { select: { id: true, firstName: true, lastName: true, phone: true } },
        },
        orderBy: { date: "desc" },
        take: 5,
      }),

      // Recent completed activity (with hangout details for type/location)
      prisma.checkIn.findMany({
        where: { contact: { userId: user.id }, status: { in: ["completed", "skipped"] } },
        include: {
          contact: { select: { firstName: true, lastName: true } },
          hangout: {
            select: {
              type: true,
              locationName: true,
              platform: true,
              checkInId: true,
            },
          },
        },
        orderBy: { completedAt: "desc" },
        take: 5,
      }),

      prisma.userProfile.findUnique({ where: { userId: user.id } }),
    ]);

    // Filter upcoming to only prompt-mode check-ins for the messages section
    const messageCheckIns = upcoming.filter(
      (ci) => !ci.contact.schedule || ci.contact.schedule.cadenceMode === "prompt"
    );

    return NextResponse.json({
      recurringSchedules,
      messageCheckIns,
      oneTimeHangouts,
      awaitingCompletion,
      recent,
      profile,
    });
  } catch (err) {
    console.error("[GET /api/dashboard]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
