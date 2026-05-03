import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: { schedule: true, checkIns: { orderBy: { scheduledAt: "asc" } } },
  });
  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(contact);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { firstName, lastName, email, phone, avatarUrl, messagingPlatform, notes } = body;

  const contact = await prisma.contact.update({
    where: { id },
    data: { firstName, lastName, email, phone, avatarUrl, messagingPlatform, notes },
  });
  return NextResponse.json(contact);
}

// Partial update — e.g. just notes or messagingPlatform
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const contact = await prisma.contact.update({
    where: { id },
    data: body,
  });
  return NextResponse.json(contact);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.contact.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
