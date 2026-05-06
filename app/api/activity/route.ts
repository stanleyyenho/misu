import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const dateFrom = url.searchParams.get("dateFrom");
  const dateTo = url.searchParams.get("dateTo");
  const location = url.searchParams.get("location")?.trim() ?? "";
  const format = url.searchParams.get("format")?.trim() ?? "";

  const contactWhere: Prisma.ContactWhereInput = { userId: user.id };
  if (q) {
    contactWhere.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
    ];
  }

  const where: Prisma.CheckInWhereInput = {
    contact: contactWhere,
    status: { in: ["completed", "skipped"] },
  };

  if (dateFrom || dateTo) {
    where.completedAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59.999Z`) } : {}),
    };
  }

  // format: "in-person" | "digital" | "message" | digital platform (zoom, facetime, ...)
  // location: text search on hangout.locationName
  const hangoutFilter: Prisma.HangoutWhereInput = {};
  if (location) hangoutFilter.locationName = { contains: location, mode: "insensitive" };

  if (format === "message") {
    where.hangout = { is: null };
  } else if (format === "in-person" || format === "digital") {
    hangoutFilter.type = format;
    where.hangout = { is: hangoutFilter };
  } else if (format) {
    hangoutFilter.type = "digital";
    hangoutFilter.platform = format;
    where.hangout = { is: hangoutFilter };
  } else if (location) {
    where.hangout = { is: hangoutFilter };
  }

  try {
    const items = await prisma.checkIn.findMany({
      where,
      include: {
        contact: { select: { firstName: true, lastName: true } },
        hangout: {
          select: { type: true, locationName: true, platform: true, checkInId: true },
        },
      },
      orderBy: { completedAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[GET /api/activity]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
