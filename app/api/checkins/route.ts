import { NextResponse } from "next/server";
import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const days = searchParams.get("days"); // upcoming within N days
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
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
