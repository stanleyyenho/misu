import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";
import { buildInviteSmsBody } from "@/lib/hangout-invite";
import { sendSms } from "@/lib/twilio";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const hangout = await prisma.hangout.findFirst({
    where: { id, userId: user.id },
    include: { contact: { select: { firstName: true, lastName: true, phone: true, email: true, smsOptOutAt: true } } },
  });
  if (!hangout) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const { notify = true, ...fields } = body;

  const allowed = ["date", "locationName", "locationAddr", "locationLat", "locationLng", "platform", "meetingLink", "noteToFriend"] as const;
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in fields) data[key] = key === "date" ? new Date(fields[key]) : fields[key];
  }

  const updated = await prisma.hangout.update({ where: { id }, data });

  if (notify && hangout.contact.phone && hangout.status !== "draft" && !hangout.contact.smsOptOutAt) {
    const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
    const senderName = profile ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") : "Someone";
    const mergedHangout = { ...hangout, ...data, id: hangout.id, date: data.date instanceof Date ? data.date : hangout.date };
    const smsBody =
      `[Updated] ` +
      buildInviteSmsBody({
        senderName,
        contact: hangout.contact,
        hangout: {
          id: hangout.id,
          type: mergedHangout.type,
          date: mergedHangout.date as Date,
          locationName: (mergedHangout.locationName as string | null) ?? null,
          locationAddr: (mergedHangout.locationAddr as string | null) ?? null,
          platform: (mergedHangout.platform as string | null) ?? null,
          meetingLink: (mergedHangout.meetingLink as string | null) ?? null,
          noteToFriend: (mergedHangout.noteToFriend as string | null) ?? null,
        },
      });
    try {
      await sendSms(hangout.contact.phone, smsBody);
    } catch (err) {
      return NextResponse.json({ hangout: updated, warning: `SMS failed: ${err instanceof Error ? err.message : String(err)}` });
    }
  }

  return NextResponse.json({ hangout: updated });
}
