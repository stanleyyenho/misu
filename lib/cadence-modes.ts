import { subDays, setHours, setMinutes, setSeconds, setMilliseconds, startOfDay } from "date-fns";
import { prisma } from "./prisma";
import { sendPushToUser } from "./webpush";
import { sendHangoutSms, sendHangoutCalendarInvite } from "./hangout-invite";

// Days before the auto-send (lead time) when we push a "pick a venue" prompt
// for in-person perpetual hangouts that have no default location set.
const VENUE_PROMPT_LEAD_DAYS = 3;

interface DefaultHangoutConfig {
  locationName?: string;
  locationAddr?: string;
  locationLat?: number;
  locationLng?: number;
  platform?: string;
  meetingLink?: string;
  time?: string;
}

function applyTime(date: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  return setMilliseconds(setSeconds(setMinutes(setHours(date, h), m), 0), 0);
}

interface HangoutParams {
  id: string;
  type: string;
  date: Date;
  locationName: string | null;
  locationAddr: string | null;
  platform: string | null;
  meetingLink: string | null;
  noteToFriend: string | null;
  contact: {
    firstName: string;
    lastName: string | null;
    phone: string | null;
    email: string | null;
  };
}

async function autoSendHangout(
  hangout: HangoutParams,
  senderName: string,
  senderEmail: string
): Promise<void> {
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
    await prisma.hangout.update({ where: { id: hangout.id }, data: { calInviteSent: true } });
  }

  // If in-person and no location, mark TBD so the daily nag can pick it up.
  const tbd = hangout.type === "in-person" && !hangout.locationName;
  await prisma.hangout.update({
    where: { id: hangout.id },
    data: { status: "invited", ...(tbd ? { locationTbdAt: new Date() } : {}) },
  });
}

export async function processCadenceModes(): Promise<{ prompted: number; autoSent: number; exhausted: number; venuePrompted: number; tbdReminded: number }> {
  const now = new Date();
  let prompted = 0;
  let autoSent = 0;
  let exhausted = 0;
  let venuePrompted = 0;
  let tbdReminded = 0;

  const schedules = await prisma.checkInSchedule.findMany({
    where: { isActive: true, scheduleType: "hangout" },
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

  // Batch-fetch all relevant user profiles in one query instead of N individual ones
  const userIds = [...new Set(schedules.map((s) => s.contact.userId))];
  const profiles = userIds.length
    ? await prisma.userProfile.findMany({ where: { userId: { in: userIds } } })
    : [];
  const profileByUserId = new Map(profiles.map((p) => [p.userId, p]));

  for (const schedule of schedules) {
    const { contact, cadenceMode, leadTimeDays, nextCheckIn } = schedule;
    const triggerDate = subDays(nextCheckIn, leadTimeDays);
    const venuePromptDate = subDays(triggerDate, VENUE_PROMPT_LEAD_DAYS);

    const profile = profileByUserId.get(contact.userId);
    const senderName = profile
      ? [profile.firstName, profile.lastName].filter(Boolean).join(" ")
      : "Someone";
    const senderEmail = profile?.email ?? "";
    const contactName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");

    // ── Pre-prompt phase: only for in-person + perpetual schedules with no default venue ──
    // Fires once per cycle when:
    //   - venuePromptDate <= now (we're inside the prompt window, or past it)
    //   - the cycle has no live Hangout yet
    //   - the schedule's defaultHangout has no locationName
    if (
      cadenceMode === "perpetual" &&
      schedule.hangoutType === "in-person" &&
      contact.hangouts.length === 0 &&
      venuePromptDate <= now &&
      now < triggerDate
    ) {
      let config: DefaultHangoutConfig = {};
      if (schedule.defaultHangout) {
        try { config = JSON.parse(schedule.defaultHangout); } catch { config = {}; }
      }

      if (!config.locationName) {
        const hangoutDate = config.time ? applyTime(nextCheckIn, config.time) : nextCheckIn;
        const draft = await prisma.hangout.create({
          data: {
            userId: contact.userId,
            contactId: contact.id,
            type: schedule.hangoutType,
            date: hangoutDate,
            locationName: null,
            locationAddr: null,
            locationLat: null,
            locationLng: null,
            platform: null,
            meetingLink: null,
            noteToFriend: schedule.noteToFriend ?? null,
            status: "draft",
            locationPromptSentAt: now,
          },
        });
        await sendPushToUser(contact.userId, {
          title: `Pick a spot to hang with ${contactName}`,
          body: `Your hangout is in ${VENUE_PROMPT_LEAD_DAYS + leadTimeDays} days — pick a venue before the invite goes out.`,
          url: `/?openHangout=${draft.id}`,
        });
        venuePrompted++;
        continue; // don't also auto-send this run
      }
    }

    if (triggerDate > now) continue;
    if (contact.hangouts.length > 0) continue;

    if (cadenceMode === "prompt") {
      await sendPushToUser(contact.userId, {
        title: `Time to plan a hangout with ${contactName}`,
        body: `You're due to meet up in ${leadTimeDays} days — pick a spot and time.`,
        url: `/contacts/${contact.id}`,
      });
      prompted++;
    } else if (cadenceMode === "perpetual") {
      let config: DefaultHangoutConfig = {};
      if (schedule.defaultHangout) {
        try { config = JSON.parse(schedule.defaultHangout); } catch { config = {}; }
      }

      // For in-person with no default location AND no defaultHangout JSON at all,
      // we still need to send (the user never picked one in the prompt window).
      // For digital, we still require a defaultHangout (existing behavior).
      if (schedule.hangoutType === "digital" && !schedule.defaultHangout) continue;

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
        await autoSendHangout(
          {
            id: hangout.id,
            type: hangout.type,
            date: hangout.date,
            locationName: hangout.locationName,
            locationAddr: hangout.locationAddr,
            platform: hangout.platform,
            meetingLink: hangout.meetingLink,
            noteToFriend: hangout.noteToFriend,
            contact: {
              firstName: contact.firstName,
              lastName: contact.lastName,
              phone: contact.phone,
              email: contact.email,
            },
          },
          senderName,
          senderEmail
        );
        autoSent++;
      } catch {
        // Leave as draft if sending fails
      }
    } else if (cadenceMode === "planned") {
      const nextInstance = await prisma.hangoutInstance.findFirst({
        where: { scheduleId: schedule.id, hangoutId: null },
        orderBy: { instanceNum: "asc" },
      });

      if (!nextInstance) {
        await sendPushToUser(contact.userId, {
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
        await autoSendHangout(
          {
            id: hangout.id,
            type: hangout.type,
            date: hangout.date,
            locationName: hangout.locationName,
            locationAddr: hangout.locationAddr,
            platform: hangout.platform,
            meetingLink: hangout.meetingLink,
            noteToFriend: hangout.noteToFriend,
            contact: {
              firstName: contact.firstName,
              lastName: contact.lastName,
              phone: contact.phone,
              email: contact.email,
            },
          },
          senderName,
          senderEmail
        );
        autoSent++;
      } catch {
        // Leave as draft if sending fails
      }
    }
  }

  // ── Pre-prompt promotion: any draft Hangout that was created during the prompt
  // phase but whose triggerDate has now arrived needs to auto-send (with TBD if
  // the user never picked a venue). ────────────────────────────────────────────
  const draftsToSend = await prisma.hangout.findMany({
    where: {
      status: "draft",
      locationPromptSentAt: { not: null },
      date: { gte: now }, // hangout date itself hasn't passed
    },
    include: {
      contact: { select: { userId: true, firstName: true, lastName: true, phone: true, email: true } },
    },
  });

  for (const draft of draftsToSend) {
    // Find the originating schedule by contact + scheduleType to recompute triggerDate
    const schedule = await prisma.checkInSchedule.findFirst({
      where: { contactId: draft.contactId, scheduleType: "hangout", isActive: true },
    });
    if (!schedule) continue;
    const triggerDate = subDays(schedule.nextCheckIn, schedule.leadTimeDays);
    if (now < triggerDate) continue;

    const profile = profileByUserId.get(draft.contact.userId)
      ?? (await prisma.userProfile.findUnique({ where: { userId: draft.contact.userId } }));
    const senderName = profile
      ? [profile.firstName, profile.lastName].filter(Boolean).join(" ")
      : "Someone";
    const senderEmail = profile?.email ?? "";

    try {
      await autoSendHangout(
        {
          id: draft.id,
          type: draft.type,
          date: draft.date,
          locationName: draft.locationName,
          locationAddr: draft.locationAddr,
          platform: draft.platform,
          meetingLink: draft.meetingLink,
          noteToFriend: draft.noteToFriend,
          contact: {
            firstName: draft.contact.firstName,
            lastName: draft.contact.lastName,
            phone: draft.contact.phone,
            email: draft.contact.email,
          },
        },
        senderName,
        senderEmail
      );
      autoSent++;
    } catch {
      // Leave as draft if sending fails
    }
  }

  // ── Daily TBD nag: hangouts that went out as TBD, still missing a venue,
  // and the date hasn't passed. Throttled to one push per calendar day. ──
  const today = startOfDay(now);
  const tbdHangouts = await prisma.hangout.findMany({
    where: {
      locationTbdAt: { not: null },
      locationName: null,
      date: { gte: now },
    },
    include: {
      contact: { select: { userId: true, firstName: true, lastName: true } },
    },
  });

  for (const h of tbdHangouts) {
    if (h.lastTbdReminderAt && h.lastTbdReminderAt >= today) continue;
    const contactName = [h.contact.firstName, h.contact.lastName].filter(Boolean).join(" ");
    await sendPushToUser(h.contact.userId, {
      title: `Pick a venue for ${contactName}`,
      body: `Your invite went out as TBD — tap to set the location.`,
      url: `/?openHangout=${h.id}`,
    });
    await prisma.hangout.update({ where: { id: h.id }, data: { lastTbdReminderAt: now } });
    tbdReminded++;
  }

  return { prompted, autoSent, exhausted, venuePrompted, tbdReminded };
}
