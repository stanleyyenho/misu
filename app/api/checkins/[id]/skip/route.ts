import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createNextCheckIn } from "@/lib/scheduling";
import { getUser } from "@/lib/supabase/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.checkIn.findFirst({
    where: { id, contact: { userId: user.id } },
    select: { id: true, contactId: true, scheduledAt: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.checkIn.update({ where: { id }, data: { status: "skipped" } });

  // Schedule next check-in from the skipped check-in's date, not from now
  await createNextCheckIn(existing.contactId, new Date(existing.scheduledAt));

  revalidateTag("checkins", "max");

  return NextResponse.json({ ok: true });
}
