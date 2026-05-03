import { addDays } from "date-fns";
import { prisma } from "./prisma";

export async function createNextCheckIn(contactId: string): Promise<void> {
  const schedule = await prisma.checkInSchedule.findUnique({
    where: { contactId },
  });
  if (!schedule || !schedule.isActive) return;

  const nextDate = addDays(new Date(), schedule.frequencyDays);

  await prisma.checkIn.create({
    data: {
      contactId,
      scheduledAt: nextDate,
      status: "pending",
    },
  });

  await prisma.checkInSchedule.update({
    where: { contactId },
    data: {
      lastCheckIn: new Date(),
      nextCheckIn: nextDate,
    },
  });
}
