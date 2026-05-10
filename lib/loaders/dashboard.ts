import { prisma } from "@/lib/prisma";

/**
 * Fetch all data the dashboard page needs in a single round-trip-batch.
 *
 * Used by both the RSC entry (`app/(app)/page.tsx`) for initial render and
 * the SWR-backed `/api/dashboard` route for client-side revalidation.
 */
export async function loadDashboardData(userId: string) {
  const now = new Date();

  const [
    recurringSchedules,
    upcoming,
    oneTimeHangouts,
    awaitingCompletion,
    needsVenue,
    recent,
    profile,
  ] = await Promise.all([
    prisma.checkInSchedule.findMany({
      where: {
        contact: { userId },
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
    }),

    prisma.checkIn.findMany({
      where: { contact: { userId }, status: "pending" },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            messagingPlatform: true,
            notes: true,
            schedules: {
              where: { scheduleType: "check-in" },
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

    prisma.hangout.findMany({
      where: {
        userId,
        checkInId: null,
        status: { in: ["draft", "invited", "confirmed"] },
        date: { gte: now },
        NOT: {
          AND: [
            { type: "in-person" },
            { locationName: null },
            { OR: [{ locationPromptSentAt: { not: null } }, { locationTbdAt: { not: null } }] },
          ],
        },
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

    prisma.hangout.findMany({
      where: {
        userId,
        type: "in-person",
        locationName: null,
        status: { in: ["draft", "invited", "confirmed"] },
        date: { gte: now },
        OR: [
          { locationPromptSentAt: { not: null } },
          { locationTbdAt: { not: null } },
        ],
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
        locationTbdAt: true,
        contact: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
      orderBy: { date: "asc" },
    }),

    prisma.hangout.findMany({
      where: {
        userId,
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

    prisma.checkIn.findMany({
      where: { contact: { userId }, status: { in: ["completed", "skipped"] } },
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

    prisma.userProfile.findUnique({ where: { userId } }),
  ]);

  const messageCheckIns = upcoming.map((ci) => ({
    ...ci,
    contact: { ...ci.contact, schedule: ci.contact.schedules[0] ?? null },
  }));

  return {
    recurringSchedules,
    messageCheckIns,
    oneTimeHangouts,
    awaitingCompletion,
    needsVenue,
    recent,
    profile,
  };
}

export type DashboardData = Awaited<ReturnType<typeof loadDashboardData>>;
