import { endOfDay } from "date-fns";
import { prisma } from "./prisma";
import { sendPushToAll } from "./webpush";

export async function sendDueCheckInNotifications(): Promise<number> {
  const dueToday = await prisma.checkIn.findMany({
    where: {
      status: "pending",
      scheduledAt: { lte: endOfDay(new Date()) },
    },
    include: { contact: true },
  });

  for (const checkIn of dueToday) {
    const name = [checkIn.contact.firstName, checkIn.contact.lastName]
      .filter(Boolean)
      .join(" ");
    await sendPushToAll({
      title: `Time to check in with ${name}`,
      body: "Tap to open Misu and log your catch-up",
      url: `/contacts/${checkIn.contactId}`,
    });
  }

  return dueToday.length;
}
