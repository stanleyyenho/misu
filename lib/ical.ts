import ICalendar from "ical-generator";

interface ContactLike {
  firstName: string;
  lastName: string | null;
  email: string | null;
}

interface CheckInLike {
  id: string;
  scheduledAt: Date;
  contact: ContactLike;
}

export function generateIcal(
  checkIns: CheckInLike[],
  calendarName = "Misu Check-ins"
): string {
  const cal = ICalendar({ name: calendarName });

  for (const checkIn of checkIns) {
    const name = [checkIn.contact.firstName, checkIn.contact.lastName]
      .filter(Boolean)
      .join(" ");

    cal.createEvent({
      id: checkIn.id,
      start: checkIn.scheduledAt,
      end: checkIn.scheduledAt,
      allDay: true,
      summary: `Check in with ${name}`,
      description: checkIn.contact.email
        ? `Email: ${checkIn.contact.email}`
        : undefined,
    });
  }

  return cal.toString();
}
