import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createNextCheckIn } from "@/lib/scheduling";
import { getUser } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.checkIn.findFirst({
    where: { id, contact: { userId: user.id } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
  revalidateTag("checkins");

  return NextResponse.json(checkIn);
}
