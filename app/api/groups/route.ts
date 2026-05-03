import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const groups = await prisma.contactGroup.findMany({
    include: { members: { select: { contactId: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(groups);
}

export async function POST(request: Request) {
  const { name } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const group = await prisma.contactGroup.create({ data: { name: name.trim() } });
  return NextResponse.json(group, { status: 201 });
}
