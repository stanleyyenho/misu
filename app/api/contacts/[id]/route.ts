import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const contact = await prisma.contact.findFirst({
    where: { id, userId: user.id },
    include: {
      schedules: true,
      checkIns: { orderBy: { scheduledAt: "asc" } },
      hangouts: { orderBy: { date: "desc" }, take: 10 },
    },
  });
  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Expose check-in schedule as `schedule` for backward compat with client components
  return NextResponse.json({
    ...contact,
    schedule: contact.schedules.find((s) => s.scheduleType === "check-in") ?? null,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.contact.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const { firstName, lastName, email, phone, avatarUrl, messagingPlatform, notes } = body;

  const contact = await prisma.contact.update({
    where: { id },
    data: { firstName, lastName, email, phone, avatarUrl, messagingPlatform, notes },
  });

  revalidateTag("contacts", "max");
  return NextResponse.json(contact);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const deleted = await prisma.contact.deleteMany({ where: { id, userId: user.id } });
  if (deleted.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  revalidateTag("contacts", "max");
  return NextResponse.json({ success: true });
}
