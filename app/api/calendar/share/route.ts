import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const shares = await prisma.calendarShare.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(shares);
}

export async function POST(request: Request) {
  const { label } = await request.json();
  if (!label) {
    return NextResponse.json({ error: "label is required" }, { status: 400 });
  }
  const share = await prisma.calendarShare.create({ data: { label } });
  return NextResponse.json(share, { status: 201 });
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  await prisma.calendarShare.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
