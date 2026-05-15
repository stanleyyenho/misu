import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";
import { sendHangoutSms, sendHangoutCalendarInvite } from "@/lib/hangout-invite";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const hangout = await prisma.hangout.findFirst({
    where: { id, userId: user.id },
    include: {
      contact: { select: { firstName: true, lastName: true, phone: true, email: true, smsConsentAt: true, smsOptOutAt: true } },
    },
  });
  if (!hangout) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (hangout.status !== "draft") {
    return NextResponse.json({ error: "Invite already sent" }, { status: 409 });
  }
  if (!hangout.contact.phone) {
    return NextResponse.json({ error: "Contact has no phone number" }, { status: 422 });
  }
  if (!hangout.contact.smsConsentAt) {
    return NextResponse.json({ error: "Contact has not been marked as having SMS consent" }, { status: 422 });
  }
  if (hangout.contact.smsOptOutAt) {
    return NextResponse.json({ error: "Contact has opted out of SMS" }, { status: 422 });
  }

  const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
  const senderName = profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(" ")
    : "Someone";

  const inviteParams = {
    senderName,
    contact: hangout.contact,
    hangout: {
      id: hangout.id,
      type: hangout.type,
      date: hangout.date,
      locationName: hangout.locationName,
      locationAddr: hangout.locationAddr,
      platform: hangout.platform,
      meetingLink: hangout.meetingLink,
      noteToFriend: hangout.noteToFriend,
    },
  };

  const errors: string[] = [];

  try {
    await sendHangoutSms(inviteParams);
  } catch (err) {
    errors.push(`SMS failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (hangout.contact.email && profile?.email) {
    try {
      await sendHangoutCalendarInvite({ ...inviteParams, senderEmail: profile.email });
      await prisma.hangout.update({ where: { id }, data: { calInviteSent: true } });
    } catch (err) {
      errors.push(`Calendar invite failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (errors.length > 0 && errors.some((e) => e.startsWith("SMS"))) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 502 });
  }

  const updated = await prisma.hangout.update({
    where: { id },
    data: { status: "invited" },
  });

  return NextResponse.json({ hangout: updated, warnings: errors.length ? errors : undefined });
}
