import { Resend } from "resend";
import ICalendar from "ical-generator";
import { format } from "date-fns";
import { sendSms } from "./twilio";

const PLATFORM_LABELS: Record<string, string> = {
  facetime: "FaceTime",
  zoom: "Zoom",
  "google-meet": "Google Meet",
  teams: "Teams",
  other: "a video call",
};

interface HangoutInviteParams {
  senderName: string;
  contact: { firstName: string; lastName: string | null; phone: string | null; email: string | null };
  hangout: {
    id: string;
    type: string;
    date: Date;
    locationName: string | null;
    locationAddr: string | null;
    platform: string | null;
    meetingLink: string | null;
    noteToFriend: string | null;
  };
}

export function buildInviteSmsBody({ senderName, contact, hangout }: HangoutInviteParams): string {
  const contactName = contact.firstName;
  const dateStr = format(hangout.date, "EEEE, MMMM d 'at' h:mm a");

  let details: string;
  if (hangout.type === "in-person" && hangout.locationName) {
    details = `${hangout.locationName}${hangout.locationAddr ? ` (${hangout.locationAddr})` : ""} on ${dateStr}`;
  } else if (hangout.type === "in-person") {
    details = `somewhere TBD on ${dateStr}`;
  } else if (hangout.type === "digital" && hangout.platform) {
    const platformLabel = PLATFORM_LABELS[hangout.platform] ?? hangout.platform;
    details = `a ${platformLabel} call on ${dateStr}`;
    if (hangout.meetingLink) details += ` — link: ${hangout.meetingLink}`;
  } else {
    details = `a hangout on ${dateStr}`;
  }

  let body = `Misu: ${senderName} invited you (${contactName}) to hang out — ${details}.`;
  if (hangout.noteToFriend) body += ` "${hangout.noteToFriend}"`;
  body += ` Reply YES to confirm, NO to decline, or text another time. Reply STOP to opt out, HELP for help.`;
  return body;
}

export async function sendHangoutSms(params: HangoutInviteParams): Promise<void> {
  const { contact, hangout } = params;
  if (!contact.phone) throw new Error("Contact has no phone number");
  const body = buildInviteSmsBody(params);
  await sendSms(contact.phone, body);
}

export async function sendHangoutCalendarInvite(
  params: HangoutInviteParams & { senderEmail: string }
): Promise<void> {
  const { senderName, senderEmail, contact, hangout } = params;
  if (!contact.email) return;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM ?? "noreply@misu.care";

  const contactName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
  const dateStr = format(hangout.date, "EEEE, MMMM d 'at' h:mm a");

  // Build .ics
  const cal = ICalendar({ name: "Misu Hangout" });
  const endDate = new Date(hangout.date.getTime() + 60 * 60 * 1000); // default 1hr

  const eventData: Parameters<typeof cal.createEvent>[0] = {
    id: hangout.id,
    start: hangout.date,
    end: endDate,
    summary: `Hangout with ${senderName}`,
    organizer: { name: senderName, email: senderEmail },
    attendees: [{ name: contactName, email: contact.email, rsvp: true }],
  };

  if (hangout.type === "in-person" && hangout.locationName) {
    eventData.location = hangout.locationAddr
      ? `${hangout.locationName}, ${hangout.locationAddr}`
      : hangout.locationName;
  } else if (hangout.type === "in-person") {
    eventData.location = "TBD";
  } else if (hangout.type === "digital" && hangout.meetingLink) {
    eventData.url = hangout.meetingLink;
  }

  if (hangout.noteToFriend) eventData.description = hangout.noteToFriend;

  cal.createEvent(eventData);

  let locationLine = "";
  if (hangout.type === "in-person" && hangout.locationName) {
    locationLine = `<p><strong>Where:</strong> ${hangout.locationName}${hangout.locationAddr ? `, ${hangout.locationAddr}` : ""}</p>`;
  } else if (hangout.type === "in-person") {
    locationLine = `<p><strong>Where:</strong> TBD — ${senderName} will follow up with the venue.</p>`;
  } else if (hangout.type === "digital" && hangout.platform) {
    const label = PLATFORM_LABELS[hangout.platform] ?? hangout.platform;
    locationLine = `<p><strong>How:</strong> ${label}${hangout.meetingLink ? ` — <a href="${hangout.meetingLink}">Join link</a>` : ""}</p>`;
  }

  await resend.emails.send({
    from,
    to: contact.email,
    subject: `${senderName} wants to hang out — ${dateStr}`,
    html: `
      <p>Hey ${contactName}!</p>
      <p>${senderName} has invited you to a hangout.</p>
      <p><strong>When:</strong> ${dateStr}</p>
      ${locationLine}
      ${hangout.noteToFriend ? `<p><em>"${hangout.noteToFriend}"</em></p>` : ""}
      <p>A calendar invite is attached — accept it to add it to your calendar.</p>
    `,
    attachments: [
      {
        filename: "hangout.ics",
        content: Buffer.from(cal.toString()).toString("base64"),
      },
    ],
  });
}
