import { addDays } from "date-fns";
import { prisma } from "./prisma";

interface JitterConfig {
  frequencyDays: number;
  frequencyJitterDays: number;
}

export function computeJitteredNextDate(config: JitterConfig, from: Date = new Date()): Date {
  const jitter = config.frequencyJitterDays ?? 0;
  const offset = jitter > 0 ? Math.floor(Math.random() * (jitter * 2 + 1)) - jitter : 0;
  return addDays(from, config.frequencyDays + offset);
}

// Advances the check-in message schedule only (scheduleType="check-in").
// Hangout schedules advance via their own complete/skip handlers.
export async function createNextCheckIn(contactId: string, fromDate?: Date): Promise<void> {
  const schedule = await prisma.checkInSchedule.findFirst({
    where: { contactId, scheduleType: "check-in" },
  });
  if (!schedule || !schedule.isActive) return;

  const nextDate = computeJitteredNextDate(schedule, fromDate ?? new Date());

  await prisma.$transaction([
    prisma.checkIn.create({ data: { contactId, scheduledAt: nextDate, status: "pending" } }),
    prisma.checkInSchedule.update({
      where: { id: schedule.id },
      data: { lastCheckIn: new Date(), nextCheckIn: nextDate },
    }),
  ]);
}
