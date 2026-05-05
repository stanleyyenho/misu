import { addDays } from "date-fns";
import { prisma } from "./prisma";

export async function createNextCheckIn(contactId: string, fromDate?: Date): Promise<void> {
  const schedule = await prisma.checkInSchedule.findUnique({
    where: { contactId },
  });
  if (!schedule || !schedule.isActive) return;

  const jitter = schedule.frequencyJitterDays ?? 0;
  const jitterOffset = jitter > 0 ? Math.floor(Math.random() * (jitter * 2 + 1)) - jitter : 0;
  const base = fromDate ?? new Date();
  const nextDate = addDays(base, schedule.frequencyDays + jitterOffset);

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
