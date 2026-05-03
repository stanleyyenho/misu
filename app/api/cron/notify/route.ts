import { NextResponse } from "next/server";
import { sendDueCheckInNotifications } from "@/lib/notify";

// Called daily by Vercel Cron (see vercel.json) or any external cron service.
// Protect with a secret so random people can't trigger it.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sent = await sendDueCheckInNotifications();
  return NextResponse.json({ sent });
}
