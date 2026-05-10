import { prisma } from "@/lib/prisma";

export async function loadContactsPageData(userId: string) {
  const [contacts, groups] = await Promise.all([
    prisma.contact.findMany({
      where: { userId },
      include: {
        schedules: true,
        groups: { select: { groupId: true } },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
    prisma.contactGroup.findMany({
      where: { userId },
      include: { members: { select: { contactId: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  // Match the legacy /api/contacts shape: a singular `schedule` derived from
  // the first check-in schedule.
  const contactsWithSchedule = contacts.map((c) => ({
    ...c,
    schedule: c.schedules.find((s) => s.scheduleType === "check-in") ?? null,
  }));

  return { contacts: contactsWithSchedule, groups };
}
