import { NextResponse } from "next/server";
import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [upcoming, recent, profile] = await Promise.all([
      prisma.checkIn.findMany({
        where: {
          contact: { userId: user.id },
          status: "pending",
          scheduledAt: { lte: addDays(new Date(), 14) },
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
                select: { tone: true, checkInType: true, approveBeforeSend: true },
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
    ]);

    return NextResponse.json({ upcoming, recent, profile });
  } catch (err) {
    console.error("[GET /api/dashboard]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
