import { NextResponse } from "next/server";
import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const days = searchParams.get("days"); // upcoming within N days
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { contact: { userId: user.id } };
    if (status) where.status = status;
    if (days) where.scheduledAt = { lte: addDays(new Date(), parseInt(days, 10)) };

    const checkIns = await prisma.checkIn.findMany({
      where,
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
      ...(limit ? { take: limit } : {}),
    });

    return NextResponse.json(checkIns);
  } catch (err) {
    console.error("[GET /api/checkins]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
