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
      schedule: true,
      checkIns: { orderBy: { scheduledAt: "asc" } },
      hangouts: { orderBy: { date: "desc" }, take: 10 },
    },
  });
  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(contact);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { firstName, lastName, email, phone, avatarUrl, messagingPlatform, notes } = body;

  const updated = await prisma.contact.updateMany({
    where: { id, userId: user.id },
    data: { firstName, lastName, email, phone, avatarUrl, messagingPlatform, notes },
  });
  if (updated.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contact = await prisma.contact.findUnique({ where: { id } });
  revalidateTag("contacts", "max");
  return NextResponse.json(contact);
}

// Partial update — e.g. just notes or messagingPlatform
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { firstName, lastName, email, phone, avatarUrl, messagingPlatform, notes } = body;

  const updated = await prisma.contact.updateMany({
    where: { id, userId: user.id },
    data: { firstName, lastName, email, phone, avatarUrl, messagingPlatform, notes },
  });
  if (updated.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contact = await prisma.contact.findUnique({ where: { id } });
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
