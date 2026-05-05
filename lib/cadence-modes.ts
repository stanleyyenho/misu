import { subDays, setHours, setMinutes, setSeconds, setMilliseconds } from "date-fns";
import { prisma } from "./prisma";
import { sendPushToAll } from "./webpush";
import { sendHangoutSms, sendHangoutCalendarInvite } from "./hangout-invite";

interface DefaultHangoutConfig {
  locationName?: string;
  locationAddr?: string;
  locationLat?: number;
  locationLng?: number;
  platform?: string;
  meetingLink?: string;
  time?: string; // HH:mm
}

function applyTime(date: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  return setMilliseconds(setSeconds(setMinutes(setHours(date, h), m), 0), 0);
}

async function autoSendHangout(
  hangoutId: string,
  senderName: string,
  senderEmail: string
): Promise<void> {
  const hangout = await prisma.hangout.findUnique({
    where: { id: hangoutId },
    include: { contact: { select: { firstName: true, lastName: true, phone: true, email: true } } },
  });
  if (!hangout) return;

  const params = {
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

  if (hangout.contact.phone) await sendHangoutSms(params);
  if (hangout.contact.email && senderEmail) {
    await sendHangoutCalendarInvite({ ...params, senderEmail });
    await prisma.hangout.update({ where: { id: hangoutId }, data: { calInviteSent: true } });
  }
  await prisma.hangout.update({ where: { id: hangoutId }, data: { status: "invited" } });
}

export async function processCadenceModes(): Promise<{ prompted: number; autoSent: number; exhausted: number }> {
  const now = new Date();
  let prompted = 0;
  let autoSent = 0;
  let exhausted = 0;

  const schedules = await prisma.checkInSchedule.findMany({
    where: { isActive: true },
    include: {
      contact: {
        include: {
          hangouts: {
            where: { status: { in: ["draft", "invited", "confirmed"] } },
            orderBy: { date: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  for (const schedule of schedules) {
    const { contact, cadenceMode, leadTimeDays, nextCheckIn } = schedule;
    const triggerDate = subDays(nextCheckIn, leadTimeDays);
    if (triggerDate > now) continue; // not time yet

    // Skip if there's already an active hangout for this contact
    if (contact.hangouts.length > 0) continue;

    const profile = await prisma.userProfile.findUnique({ where: { userId: contact.userId } });
    const senderName = profile
      ? [profile.firstName, profile.lastName].filter(Boolean).join(" ")
      : "Someone";
    const senderEmail = profile?.email ?? "";
    const contactName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");

    if (cadenceMode === "prompt") {
      await sendPushToAll({
        title: `Time to plan a hangout with ${contactName}`,
        body: `You're due to meet up in ${leadTimeDays} days — pick a spot and time.`,
        url: `/contacts/${contact.id}`,
      });
      prompted++;
    } else if (cadenceMode === "perpetual") {
      if (!schedule.defaultHangout) continue;
      let config: DefaultHangoutConfig;
      try { config = JSON.parse(schedule.defaultHangout); } catch { continue; }

      const hangoutDate = config.time ? applyTime(nextCheckIn, config.time) : nextCheckIn;

      const hangout = await prisma.hangout.create({
        data: {
          userId: contact.userId,
          contactId: contact.id,
          type: schedule.hangoutType,
          date: hangoutDate,
          locationName: config.locationName ?? null,
          locationAddr: config.locationAddr ?? null,
          locationLat: config.locationLat ?? null,
          locationLng: config.locationLng ?? null,
          platform: config.platform ?? null,
          meetingLink: config.meetingLink ?? null,
          noteToFriend: schedule.noteToFriend ?? null,
          status: "draft",
        },
      });

      try {
        await autoSendHangout(hangout.id, senderName, senderEmail);
        autoSent++;
      } catch {
        // Leave as draft if sending fails — user can retry manually
      }
    } else if (cadenceMode === "planned") {
      const nextInstance = await prisma.hangoutInstance.findFirst({
        where: { scheduleId: schedule.id, hangoutId: null },
        orderBy: { instanceNum: "asc" },
      });

      if (!nextInstance) {
        await sendPushToAll({
          title: `Plan more hangouts with ${contactName}`,
          body: `Your pre-planned hangout list is empty — add more in Misu.`,
          url: `/contacts/${contact.id}`,
        });
        exhausted++;
        continue;
      }

      const hangout = await prisma.hangout.create({
        data: {
          userId: contact.userId,
          contactId: contact.id,
          type: schedule.hangoutType,
          date: nextInstance.date,
          locationName: nextInstance.locationName,
          locationAddr: nextInstance.locationAddr,
          locationLat: nextInstance.locationLat,
          locationLng: nextInstance.locationLng,
          platform: nextInstance.platform,
          meetingLink: nextInstance.meetingLink,
          noteToFriend: schedule.noteToFriend ?? null,
          status: "draft",
        },
      });

      await prisma.hangoutInstance.update({
        where: { id: nextInstance.id },
        data: { hangoutId: hangout.id },
      });

      try {
        await autoSendHangout(hangout.id, senderName, senderEmail);
        autoSent++;
      } catch {
        // Leave as draft if sending fails
      }
    }
  }

  return { prompted, autoSent, exhausted };
}
