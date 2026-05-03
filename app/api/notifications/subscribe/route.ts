import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const { endpoint, keys } = body;

  if (!endpoint || !keys) {
    return NextResponse.json({ error: "endpoint and keys are required" }, { status: 400 });
  }

  await prisma.notificationSubscription.upsert({
    where: { endpoint },
    create: { endpoint, keys: JSON.stringify(keys) },
    update: { keys: JSON.stringify(keys) },
  });

  return NextResponse.json({ success: true });
}
