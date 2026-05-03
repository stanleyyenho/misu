import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { logId } = await request.json();
  if (!logId) return NextResponse.json({ error: "logId required" }, { status: 400 });

  await prisma.messageLog.update({
    where: { id: logId },
    data: { status: "sent", sentAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
