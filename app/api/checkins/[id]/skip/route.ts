import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createNextCheckIn } from "@/lib/scheduling";
import { getUser } from "@/lib/supabase/server";
import { sendSms } from "@/lib/twilio";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.checkIn.findFirst({
    where: { id, contact: { userId: user.id } },
    select: {
      id: true,
      contactId: true,
      scheduledAt: true,
      contact: {
        select: {
          firstName: true,
          phone: true,
          schedule: { select: { cadenceMode: true } },
        },
      },
    },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.checkIn.update({ where: { id }, data: { status: "skipped" } });

  // Schedule next check-in from the skipped check-in's date, not from now
  await createNextCheckIn(existing.contactId, new Date(existing.scheduledAt));

  revalidateTag("checkins", "max");

  // For hangout-mode check-ins, SMS the contact that we can't make it
  const cadenceMode = existing.contact.schedule?.cadenceMode;
  if (cadenceMode && cadenceMode !== "prompt" && existing.contact.phone) {
    try {
      const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
      const senderName = profile
        ? [profile.firstName, profile.lastName].filter(Boolean).join(" ")
        : "Someone";
      await sendSms(
        existing.contact.phone,
        `Hey ${existing.contact.firstName}! ${senderName} here — I have to skip our hangout this time. Let's find another time soon!`
      );
    } catch (err) {
      console.error("[skip/route] SMS failed:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
