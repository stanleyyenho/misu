import { NextResponse } from "next/server";
import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const now = new Date();

    const [upcoming, recent, profile, upcomingHangouts, awaitingCompletion] = await Promise.all([
      prisma.checkIn.findMany({
        where: {
          contact: { userId: user.id },
          status: "pending",
          scheduledAt: { lte: addDays(now, 14) },
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
                select: { tone: true, checkInType: true, approveBeforeSend: true, frequencyDays: true, cadenceMode: true },
              },
            },
          },
        },
        orderBy: { scheduledAt: "asc" },
      }),
      prisma.checkIn.findMany({
        where: { contact: { userId: user.id }, status: "completed" },
        include: {
          contact: { select: { firstName: true, lastName: true } },
        },
        orderBy: { scheduledAt: "asc" },
        take: 5,
      }),
      prisma.userProfile.findUnique({ where: { userId: user.id } }),
      // Upcoming hangouts (next 30 days) — any non-completed status
      prisma.hangout.findMany({
        where: {
          userId: user.id,
          status: { in: ["draft", "invited", "confirmed"] },
          date: { gte: now, lte: addDays(now, 30) },
        },
        select: {
          id: true, type: true, status: true, date: true,
          locationName: true, locationAddr: true, platform: true,
          meetingLink: true, noteToFriend: true, checkInId: true,
          contact: { select: { id: true, firstName: true, lastName: true, phone: true } },
        },
        orderBy: { date: "asc" },
        take: 5,
      }),
      // Past hangouts awaiting completion
      prisma.hangout.findMany({
        where: {
          userId: user.id,
          status: { in: ["confirmed", "invited"] },
          date: { lt: now },
        },
        include: { contact: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { date: "desc" },
        take: 5,
      }),
    ]);

    return NextResponse.json({ upcoming, recent, profile, upcomingHangouts, awaitingCompletion });
  } catch (err) {
    console.error("[GET /api/dashboard]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
