import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { logId } = await request.json();
  if (!logId) return NextResponse.json({ error: "logId required" }, { status: 400 });

  const existing = await prisma.messageLog.findFirst({
    where: { id: logId, contact: { userId: user.id } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.messageLog.update({
    where: { id: logId },
    data: { status: "sent", sentAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
