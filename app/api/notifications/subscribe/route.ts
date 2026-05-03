import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { endpoint, keys } = body;

  if (!endpoint || !keys) {
    return NextResponse.json({ error: "endpoint and keys are required" }, { status: 400 });
  }

  await prisma.notificationSubscription.upsert({
    where: { endpoint },
    create: { userId: user.id, endpoint, keys: JSON.stringify(keys) },
    update: { userId: user.id, keys: JSON.stringify(keys) },
  });

  return NextResponse.json({ success: true });
}
