# Misu v2 — Product Requirements Document

**Author:** Stanley Ho  
**Date:** May 2026  
**Status:** Draft

---

## 1. Overview

Misu v1 established a check-in reminder loop: the app nudges you to reach out, then AI drafts a message you can send. Misu v2 closes the loop from nudge → message → *actual coordinated hangout*. The core metaphor is **Partiful for recurring one-on-one friend relationships**, blended with the **Slack Donut cadence engine**.

Rather than just prompting you to send a text, Misu v2 actively coordinates the logistics — location, time, format — and handles the invite delivery, RSVP, and reminders so the hangout actually happens.

---

## 2. Problem Statement

Maintaining close friendships as an adult is an intent problem, not a care problem. People want to see their friends regularly but the friction of:
1. Remembering to reach out at the right cadence
2. Agreeing on a time and place
3. Following through on reminders

...causes hangouts to fall through. Misu v1 solved (1). Misu v2 solves all three.

---

## 3. Goals

| Goal | Metric |
|---|---|
| Reduce hangout drop-off from scheduled to happened | % of initiated hangouts marked complete |
| Reduce coordination friction | Time from "due for a check-in" to confirmed hangout |
| Support both in-person and digital hangouts | Both check-in types available to all users |

---

## 4. User Stories

**As a Misu user, I want to…**

- Set a recurring check-in cadence with a specific friend (e.g., every 3 weeks)
- Choose whether that check-in is in-person (same city) or digital (video call)
- Be prompted ahead of each cadence mark to pick a specific location/time/format
- Have Misu send my friend an invite via SMS (and optionally calendar via email)
- Let my friend RSVP — accept, decline, or counter-propose — via text, without needing the app
- Receive and have my friend receive reminders leading up to the hangout
- Pre-plan recurring hangouts up to N instances in advance with fixed details per instance
- Set a "default" recurring plan that repeats the same details indefinitely (same spot, same time)

---

## 5. Feature Spec

### 5.1 Check-in Cadence (already in v1, extended in v2)

**Existing:** `CheckInSchedule.frequencyDays` drives a daily cron that creates `CheckIn` records and sends push notifications to the Misu user.

**v2 extension:** The cadence is now the trigger for *hangout coordination*, not just message generation. The cadence drives one of two flows (Mode A or Mode B, user's choice per contact).

---

### 5.2 Hangout Type

Per-contact setting. Two types:

| Type | Description |
|---|---|
| **In-person** | Meet at a physical location; coordinates address, date, time |
| **Digital** | Video call; coordinates platform (Zoom / FaceTime / Google Meet / Teams / etc.), date, time |

Both types share the same invite → RSVP → reminder infrastructure. Only the invite content differs.

---

### 5.3 Cadence Mode

Per-contact setting. User chooses one:

#### Mode A — Prompt-on-Approach

- User sets a cadence (e.g., every 4 weeks) and a **lead time** (e.g., 7 days before the cadence mark)
- At the lead time, Misu sends the user an in-app notification: *"You're due to hang out with [Friend] in 7 days. Pick a spot and time."*
- User opens the hangout planning flow (see §5.5), fills in details, and fires the invite
- One-shot per cycle; user re-plans each time

#### Mode B — Pre-Scheduled Recurring

User has two sub-options:

**B1 — Perpetual default:** Set a fixed location/time/format that repeats every cycle, indefinitely. Misu auto-sends the invite on the lead-time schedule without prompting the user each cycle.

> Example: Coffee at Sparks every 2 weeks, Saturdays at 10am — same invite every time.

**B2 — Planned instances:** User maps out up to **10 future instances** in advance. For each instance they specify the exact location/time/format. Misu works through the list in order. When the list runs out, the cadence pauses and prompts the user to plan more.

> Example: Every 2 months for the next 10 months — user pre-fills 5 instances with different spots.

---

### 5.4 Hangout Planning Flow (in-app)

Triggered by Mode A notification, or entered manually from the contact detail page.

**Fields:**

| Field | In-person | Digital |
|---|---|---|
| Date | Required | Required |
| Time | Required | Required |
| Location (search via maps) | Required | — |
| Platform (Zoom / FaceTime / Google Meet / etc.) | — | Required |
| Meeting link (optional) | — | Optional |
| Note to friend (optional) | Both | Both |

**Location picker (in-person):**
- Embedded map search (Google Maps or Apple Maps)
- User types a venue name or address, selects from results
- Selected venue name + address stored on the hangout record
- Future: integrate with Yelp/Google Places for recommendations near user

**After filling in the form:** → Preview invite text → Send button fires the invite (§5.6)

---

### 5.5 Outbound Invite

When the hangout is created and sent:

**Primary channel: SMS via Twilio** (already scaffolded in v1)

Message template — in-person:
> "Hey [Name]! [Your Name] wants to hang out — [Venue Name] on [Day], [Date] at [Time]. Reply YES to confirm, NO to decline, or suggest another time."

Message template — digital:
> "Hey [Name]! [Your Name] wants to do a [Platform] call on [Day], [Date] at [Time]. Reply YES to confirm, NO to decline, or suggest another time."

**Secondary channel: Email calendar invite** (if contact has email on file)
- Standard `.ics` calendar invite
- Sent alongside the SMS
- In-person: includes venue address
- Digital: includes platform + meeting link if provided

---

### 5.6 RSVP Flow (contact-side, via SMS)

The contact receives an SMS and replies. Twilio webhook parses the reply:

| Reply | Misu action |
|---|---|
| YES / Y / Accept | Mark hangout `confirmed`; send confirmation SMS to contact; notify Misu user in-app |
| NO / N / Decline | Mark hangout `declined`; notify Misu user in-app; offer to re-plan |
| Any other text (counter-propose) | Mark hangout `pending-counter`; forward the raw reply to Misu user in-app for manual follow-up |

If the contact does not have SMS capability or this flow isn't possible, Misu user sees a "Share invite link" fallback that generates a web-based RSVP page the contact can open.

**Contact-side app access (stretch goal):** If the contact creates a Misu account, they can RSVP and view hangout details inside the app. Not required for v2 launch.

---

### 5.7 Reminders

Once the hangout is `confirmed`:

**To the contact (SMS):**
- Reminder at user-configurable intervals, e.g.: 3 days before, 1 day before, day-of (morning)
- Each reminder includes venue/platform + time

**To the Misu user (push notification):**
- Same schedule as contact reminders

Default reminder schedule (overridable per hangout):
- 3 days before
- Day of at 8am

---

### 5.8 Post-Hangout

After the hangout date passes:
- Misu prompts the user: *"Did you hang out with [Friend]?"* → Mark as completed or skipped
- If completed: logs to `CheckIn` history, resets cadence clock for the next cycle
- If skipped: cadence clock resets from today (doesn't stack)

---

## 6. What's Already Built (v1 carry-forward)

| Capability | Status |
|---|---|
| Contact management + import | Done |
| Check-in cadence (`CheckInSchedule`) | Done |
| Daily cron triggering check-in records | Done |
| Push notifications to Misu user | Done |
| SMS delivery via Twilio | Scaffolded (needs activation) |
| AI message generation (Claude) | Done |
| Calendar view of check-ins | Done |
| Auth (multi-user, Supabase) | Done |

---

## 7. Net New for v2

| Feature | Notes |
|---|---|
| Hangout type (in-person vs digital) per contact | New field on `CheckInSchedule` |
| Cadence mode (A / B1 / B2) per contact | New field + new `HangoutInstance` model |
| Hangout planning flow (map search, time/date picker) | New UI + new `Hangout` model |
| Outbound invite via SMS | Extend existing Twilio integration |
| Outbound calendar invite via email | New: Resend + `.ics` generation |
| Inbound RSVP parsing (Twilio webhook) | New webhook route |
| RSVP state machine (pending → confirmed / declined / counter) | New |
| Contact-side reminder SMS sequence | New |
| Post-hangout completion prompt | Extend existing check-in completion logic |
| Pre-planned instances UI (Mode B2) | New UI + `HangoutInstance` table |

---

## 8. Data Model Changes

### New model: `Hangout`

```
Hangout {
  id            String   // cuid
  userId        String
  contactId     String   → Contact
  checkInId     String?  → CheckIn (nullable, linked when triggered by cadence)
  type          String   // in-person | digital
  status        String   // draft | invited | confirmed | declined | counter | completed | skipped
  date          DateTime
  locationName  String?  // in-person: venue name
  locationAddr  String?  // in-person: full address
  locationLat   Float?
  locationLng   Float?
  platform      String?  // digital: zoom | facetime | google-meet | teams | other
  meetingLink   String?  // digital: optional URL
  noteToFriend  String?
  calInviteSent Boolean  @default(false)
  createdAt     DateTime
  updatedAt     DateTime
  reminders     HangoutReminder[]
}
```

### New model: `HangoutReminder`

```
HangoutReminder {
  id         String
  hangoutId  String   → Hangout
  sendAt     DateTime
  channel    String   // sms | push
  recipient  String   // contact | user
  sentAt     DateTime?
  status     String   // scheduled | sent | failed
}
```

### New model: `HangoutInstance` (Mode B2)

```
HangoutInstance {
  id          String
  scheduleId  String   → CheckInSchedule
  instanceNum Int      // 1-based sequence position
  date        DateTime
  locationName String?
  locationAddr String?
  platform    String?
  meetingLink String?
  hangoutId   String?  → Hangout (null until instance is activated)
  createdAt   DateTime
}
```

### Changes to `CheckInSchedule`

New fields:
```
hangoutType      String   @default("in-person")  // in-person | digital
cadenceMode      String   @default("prompt")      // prompt | perpetual | planned
leadTimeDays     Int      @default(7)
// For perpetual (B1): default hangout config stored as JSON
defaultHangout   String?  // JSON: { locationName, locationAddr, platform, meetingLink, time (HH:mm) }
```

---

## 9. Out of Scope for v2

- Contact-side Misu account / in-app RSVP
- Group hangouts (3+ people)
- Yelp / third-party venue recommendations (maps search only)
- Ride-share or payment coordination
- Native iOS app (web-first, same Supabase backend)
- Read-receipts / delivery confirmation beyond Twilio status callbacks

---

## 10. Decisions Log

| # | Question | Decision |
|---|---|---|
| 1 | Maps provider for location search | **Apple Maps (MapKit JS)** — free tier, Yelp POI data in North America, iOS-ready |
| 2 | Twilio number strategy | **Shared number + lookup table** — simpler, cost-effective at early scale |
| 3 | Email provider for calendar invites | **Resend** — already in use, free tier covers early growth |
| 4 | Mode B2 planned instances cap | **10 instances max** — covers every realistic planning horizon |
| 5 | Counter-propose SMS handling | **Relay raw text** — forward contact's reply to Misu user in-app; no parsing |
| 6 | Auto-generate meeting links (digital hangouts) | **Manual paste only** — skip OAuth integrations for v2; revisit in v3 |
