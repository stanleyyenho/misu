import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const hangout = await prisma.hangout.findFirst({
    where: { id, userId: user.id },
    include: { contact: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } } },
  });
  if (!hangout) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(hangout);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const owned = await prisma.hangout.findFirst({ where: { id, userId: user.id } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const allowed = [
    "status", "date", "locationName", "locationAddr", "locationLat", "locationLng",
    "platform", "meetingLink", "noteToFriend", "calInviteSent",
  ] as const;

  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = key === "date" ? new Date(body[key]) : body[key];
  }

  const hangout = await prisma.hangout.update({ where: { id }, data });
  return NextResponse.json(hangout);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const owned = await prisma.hangout.findFirst({ where: { id, userId: user.id } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.hangout.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
