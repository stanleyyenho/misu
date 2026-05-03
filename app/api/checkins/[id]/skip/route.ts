import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNextCheckIn } from "@/lib/scheduling";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const checkIn = await prisma.checkIn.update({
    where: { id },
    data: { status: "skipped" },
  });

  await createNextCheckIn(checkIn.contactId);

  return NextResponse.json(checkIn);
}
