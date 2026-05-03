import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const contacts = await prisma.contact.findMany({
    include: { schedule: true },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });
  return NextResponse.json(contacts);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { firstName, lastName, email, phone, avatarUrl } = body;

  if (!firstName) {
    return NextResponse.json({ error: "firstName is required" }, { status: 400 });
  }

  const contact = await prisma.contact.create({
    data: { firstName, lastName, email, phone, avatarUrl },
  });
  return NextResponse.json(contact, { status: 201 });
}
