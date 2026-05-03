import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNextCheckIn } from "@/lib/scheduling";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { format, notes } = body;

  const checkIn = await prisma.checkIn.update({
    where: { id },
    data: {
      status: "completed",
      completedAt: new Date(),
      format: format ?? null,
      notes: notes ?? null,
    },
  });

  await createNextCheckIn(checkIn.contactId);

  return NextResponse.json(checkIn);
}
