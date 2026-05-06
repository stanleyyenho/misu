import { subDays, startOfDay, endOfDay } from "date-fns";
import { format } from "date-fns";
import { prisma } from "./prisma";
import { sendSms } from "./twilio";
import { sendPushToUser } from "./webpush";

const PLATFORM_LABELS: Record<string, string> = {
  facetime: "FaceTime",
  zoom: "Zoom",
  "google-meet": "Google Meet",
  teams: "Teams",
  other: "a video call",
};

// Seed HangoutReminder rows for any confirmed hangout that has none yet.
// Skips reminder slots that are already in the past.
export async function seedPendingReminders(): Promise<number> {
  const now = new Date();

  const confirmed = await prisma.hangout.findMany({
    where: {
      status: "confirmed",
      date: { gt: now },
      reminders: { none: {} },
    },
    include: {
      contact: { select: { firstName: true, phone: true } },
    },
  });

  let seeded = 0;

  for (const hangout of confirmed) {
    const slots = [
      { offsetDays: 3, label: "3-day" },
      { offsetDays: 0, label: "day-of" },
    ];

    const creates = [];

    for (const slot of slots) {
      const sendAt =
        slot.offsetDays === 0
          ? startOfDay(hangout.date)
          : subDays(hangout.date, slot.offsetDays);

      if (sendAt <= now) continue;

      if (hangout.contact.phone) {
        creates.push(
          prisma.hangoutReminder.create({
            data: { hangoutId: hangout.id, sendAt, channel: "sms", recipient: "contact", status: "scheduled" },
          })
        );
        seeded++;
      }

      creates.push(
        prisma.hangoutReminder.create({
          data: { hangoutId: hangout.id, sendAt, channel: "push", recipient: "user", status: "scheduled" },
        })
      );
      seeded++;
    }

    await Promise.all(creates);
  }

  return seeded;
}

// Fire all due reminders (sendAt <= end of today, status = scheduled).
export async function fireDueReminders(): Promise<number> {
  const due = await prisma.hangoutReminder.findMany({
    where: {
      status: "scheduled",
      sendAt: { lte: endOfDay(new Date()) },
    },
    include: {
      hangout: {
        include: {
          contact: { select: { firstName: true, lastName: true, phone: true } },
        },
      },
    },
  });

  let fired = 0;

  for (const reminder of due) {
    const { hangout } = reminder;
    const contactName = [hangout.contact.firstName, hangout.contact.lastName]
      .filter(Boolean)
      .join(" ");
    const dateStr = format(hangout.date, "EEEE, MMMM d 'at' h:mm a");

    let locationDetail = "";
    if (hangout.type === "in-person" && hangout.locationName) {
      locationDetail = ` at ${hangout.locationName}`;
    } else if (hangout.type === "digital" && hangout.platform) {
      locationDetail = ` via ${PLATFORM_LABELS[hangout.platform] ?? hangout.platform}`;
    }

    try {
      if (reminder.channel === "sms" && hangout.contact.phone) {
        const isToday = startOfDay(reminder.sendAt).getTime() === startOfDay(hangout.date).getTime();
        const body = isToday
          ? `Reminder: your hangout is today${locationDetail} — ${dateStr}. See you there!`
          : `Reminder: you have a hangout coming up${locationDetail} on ${dateStr}.`;
        await sendSms(hangout.contact.phone, body);
      }

      if (reminder.channel === "push") {
        const isToday = startOfDay(reminder.sendAt).getTime() === startOfDay(hangout.date).getTime();
        await sendPushToUser(hangout.userId, {
          title: isToday
            ? `Hangout with ${contactName} is today!`
            : `Hangout with ${contactName} in 3 days`,
          body: `${dateStr}${locationDetail}`,
          url: `/contacts/${hangout.contactId}`,
        });
      }

      await prisma.hangoutReminder.update({
        where: { id: reminder.id },
        data: { status: "sent", sentAt: new Date() },
      });
      fired++;
    } catch {
      await prisma.hangoutReminder.update({
        where: { id: reminder.id },
        data: { status: "failed" },
      });
    }
  }

  return fired;
}
