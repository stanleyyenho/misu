import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const checkIns = await prisma.checkIn.findMany({
      where: status ? { status } : undefined,
      include: { contact: { include: { schedule: true } } },
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json(checkIns);
  } catch (err) {
    console.error("[GET /api/checkins]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
