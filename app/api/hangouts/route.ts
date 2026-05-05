import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hangouts = await prisma.hangout.findMany({
    where: { userId: user.id },
    include: { contact: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } } },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(hangouts);
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    contactId,
    checkInId,
    type,
    date,
    locationName,
    locationAddr,
    locationLat,
    locationLng,
    platform,
    meetingLink,
    noteToFriend,
  } = body;

  if (!contactId || !type || !date) {
    return NextResponse.json({ error: "contactId, type, and date are required" }, { status: 400 });
  }
  if (type !== "in-person" && type !== "digital") {
    return NextResponse.json({ error: "type must be in-person or digital" }, { status: 400 });
  }

  const owned = await prisma.contact.findFirst({ where: { id: contactId, userId: user.id } });
  if (!owned) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

  const hangout = await prisma.hangout.create({
    data: {
      userId: user.id,
      contactId,
      checkInId: checkInId ?? null,
      type,
      date: new Date(date),
      locationName: locationName ?? null,
      locationAddr: locationAddr ?? null,
      locationLat: locationLat ?? null,
      locationLng: locationLng ?? null,
      platform: platform ?? null,
      meetingLink: meetingLink ?? null,
      noteToFriend: noteToFriend ?? null,
      status: "draft",
    },
    include: { contact: { select: { id: true, firstName: true, lastName: true } } },
  });

  return NextResponse.json(hangout, { status: 201 });
}
