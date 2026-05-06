"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useState, useEffect, useCallback, useMemo } from "react";
import { format, isPast, differenceInCalendarDays } from "date-fns";
import { CalendarEventModal, type CheckInDetail, type HangoutDetail } from "@/components/CalendarEventModal";
import { RecurringHangoutDetailModal, type RecurringSchedule } from "@/components/RecurringHangoutDetailModal";
import { SunnyDayIllustration } from "./illustrations/SunnyDayIllustration";
import { getAvatarColor } from "@/lib/avatar-color";

// ─── types ────────────────────────────────────────────────────────────────────

type SelectedEvent =
  | { kind: "checkin"; data: CheckInDetail }
  | { kind: "hangout"; data: HangoutDetail }
  | { kind: "schedule"; data: RecurringSchedule };

// ─── colors ───────────────────────────────────────────────────────────────────

const CHECKIN_COLORS = [
  "oklch(0.60 0.09 150)",
  "oklch(0.65 0.10 55)",
  "oklch(0.58 0.08 280)",
  "oklch(0.60 0.09 170)",
  "oklch(0.58 0.10 35)",
];

function getContactColor(contactId: string): string {
  let hash = 0;
  for (let i = 0; i < contactId.length; i++)
    hash = (hash * 31 + contactId.charCodeAt(i)) | 0;
  return CHECKIN_COLORS[Math.abs(hash) % CHECKIN_COLORS.length];
}

// ─── icons ────────────────────────────────────────────────────────────────────

type EventKind = "message" | "one-time" | "recurring";

function checkInKind(ci: CheckInDetail): EventKind {
  const cadenceMode = ci.contact.schedule?.cadenceMode;
  return cadenceMode && cadenceMode !== "prompt" ? "recurring" : "message";
}

function hangoutKind(h: HangoutDetail): EventKind {
  return h.checkInId ? "recurring" : "one-time";
}

function EventIcon({ kind, size = 14 }: { kind: EventKind; size?: number }) {
  const stroke = "currentColor";
  const sw = 2;
  if (kind === "message") {
    // Chat bubble
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
      </svg>
    );
  }
  if (kind === "one-time") {
    // Calendar with single dot
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="3" />
        <path d="M16 2v4M8 2v4M3 10h18" />
        <circle cx="12" cy="16" r="1.5" fill={stroke} stroke="none" />
      </svg>
    );
  }
  // recurring — circular arrows
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 0 1 15.3-6.4L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.3 6.4L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

// renderToString helper for FullCalendar event title strings
function eventIconSvg(kind: EventKind): string {
  if (kind === "message") {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-2px;margin-right:4px;flex-shrink:0"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>`;
  }
  if (kind === "one-time") {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-2px;margin-right:4px;flex-shrink:0"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/><circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none"/></svg>`;
  }
  return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-2px;margin-right:4px;flex-shrink:0"><path d="M3 12a9 9 0 0 1 15.3-6.4L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.3 6.4L3 16"/><path d="M3 21v-5h5"/></svg>`;
}

// ─── CalendarView ─────────────────────────────────────────────────────────────

export function CalendarView() {
  const [checkIns, setCheckIns] = useState<CheckInDetail[]>([]);
  const [hangouts, setHangouts] = useState<HangoutDetail[]>([]);
  const [schedules, setSchedules] = useState<RecurringSchedule[]>([]);
  const [selected, setSelected] = useState<SelectedEvent | null>(null);

  const load = useCallback(async () => {
    const [ciRes, hRes, sRes] = await Promise.all([
      fetch("/api/checkins?status=pending"),
      fetch("/api/hangouts"),
      fetch("/api/hangout-schedules"),
    ]);
    if (ciRes.ok) setCheckIns(await ciRes.json());
    if (hRes.ok) {
      const all: HangoutDetail[] = await hRes.json();
      // Only show future, non-completed/skipped hangouts on the calendar
      setHangouts(all.filter((h) => !["completed", "skipped"].includes(h.status) && new Date(h.date) >= new Date(Date.now() - 86400000)));
    }
    if (sRes.ok) setSchedules(await sRes.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── build FullCalendar events ────────────────────────────────────────────

  const checkInEvents = checkIns.map((ci) => {
    const name = [ci.contact.firstName, ci.contact.lastName].filter(Boolean).join(" ");
    const overdue = isPast(new Date(ci.scheduledAt));
    return {
      id: `ci-${ci.id}`,
      title: name,
      date: ci.scheduledAt.split("T")[0],
      extendedProps: { kind: "checkin" as const, data: ci, eventKind: checkInKind(ci) },
      backgroundColor: overdue ? "oklch(0.57 0.22 27)" : getContactColor(ci.contact.id),
      borderColor: "transparent",
      textColor: "oklch(0.985 0.006 80)",
    };
  });

  const hangoutEvents = hangouts.map((h) => {
    const name = [h.contact.firstName, h.contact.lastName].filter(Boolean).join(" ");
    return {
      id: `h-${h.id}`,
      title: name,
      date: new Date(h.date).toISOString().split("T")[0],
      extendedProps: { kind: "hangout" as const, data: h, eventKind: hangoutKind(h) },
      backgroundColor: "oklch(0.60 0.12 290)",
      borderColor: "transparent",
      textColor: "oklch(0.985 0.006 80)",
    };
  });

  // Project active recurring hangout schedules — but skip any whose next
  // occurrence has already been materialized into a Hangout for the same contact.
  const materializedKey = (contactId: string, date: Date) =>
    `${contactId}|${format(date, "yyyy-MM-dd")}`;
  const materialized = new Set(
    hangouts.map((h) => materializedKey(h.contact.id, new Date(h.date))),
  );
  const projectedSchedules = schedules.filter(
    (s) => !materialized.has(materializedKey(s.contactId, new Date(s.nextCheckIn))),
  );

  const scheduleEvents = projectedSchedules.map((s) => {
    const name = [s.contact.firstName, s.contact.lastName].filter(Boolean).join(" ");
    return {
      id: `s-${s.id}`,
      title: name,
      date: new Date(s.nextCheckIn).toISOString().split("T")[0],
      extendedProps: { kind: "schedule" as const, data: s, eventKind: "recurring" as EventKind },
      backgroundColor: "oklch(0.60 0.12 290)",
      borderColor: "transparent",
      textColor: "oklch(0.985 0.006 80)",
    };
  });

  const events = [...checkInEvents, ...hangoutEvents, ...scheduleEvents];

  // ── unified mobile list: combine, sort, group by month ──────────────────

  type ListItem =
    | { kind: "checkin"; data: CheckInDetail; date: Date }
    | { kind: "hangout"; data: HangoutDetail; date: Date }
    | { kind: "schedule"; data: RecurringSchedule; date: Date };

  const monthGroups = useMemo(() => {
    const items: ListItem[] = [
      ...checkIns.map((ci) => ({ kind: "checkin" as const, data: ci, date: new Date(ci.scheduledAt) })),
      ...hangouts.map((h) => ({ kind: "hangout" as const, data: h, date: new Date(h.date) })),
      ...projectedSchedules.map((s) => ({ kind: "schedule" as const, data: s, date: new Date(s.nextCheckIn) })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    const groups = new Map<string, { label: string; items: ListItem[] }>();
    for (const it of items) {
      const key = format(it.date, "yyyy-MM");
      const label = format(it.date, "MMM yyyy").toUpperCase();
      if (!groups.has(key)) groups.set(key, { label, items: [] });
      groups.get(key)!.items.push(it);
    }
    return Array.from(groups.values());
  }, [checkIns, hangouts, schedules]);

  // ── empty state ──────────────────────────────────────────────────────────

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-4">
      <SunnyDayIllustration size={140} />
      <div>
        <p className="text-lg font-bold">All caught up!</p>
        <p className="text-sm text-muted-foreground mt-1">
          Head to Contacts to schedule your first check-in
        </p>
      </div>
    </div>
  );

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* legend */}
      {events.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4 text-xs font-semibold text-muted-foreground">
          <span className="flex items-center gap-1.5"><EventIcon kind="message" /> Message check-in</span>
          <span className="flex items-center gap-1.5"><EventIcon kind="one-time" /> One-time hangout</span>
          <span className="flex items-center gap-1.5"><EventIcon kind="recurring" /> Recurring hangout</span>
        </div>
      )}

      {/* Desktop: full calendar */}
      <div className="hidden md:block">
        {events.length === 0 ? emptyState : (
        <div
          className="misu-cal-card bg-white overflow-hidden"
          style={{
            border: "2px solid #1F2024",
            borderRadius: "10px",
            boxShadow: "4px 4px 0 #1F2024",
          }}
        >
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,dayGridWeek" }}
            buttonText={{ today: "Today", month: "Month", week: "Week" }}
            events={events}
            eventContent={(arg) => {
              const ep = arg.event.extendedProps as { eventKind: EventKind };
              const html = `<span style="display:inline-flex;align-items:center;gap:0;min-width:0">${eventIconSvg(ep.eventKind)}<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${arg.event.title}</span></span>`;
              return { html };
            }}
            eventClick={(info) => {
              const ep = info.event.extendedProps as { kind: "checkin" | "hangout" | "schedule"; data: CheckInDetail | HangoutDetail | RecurringSchedule };
              if (ep.kind === "checkin") setSelected({ kind: "checkin", data: ep.data as CheckInDetail });
              else if (ep.kind === "hangout") setSelected({ kind: "hangout", data: ep.data as HangoutDetail });
              else setSelected({ kind: "schedule", data: ep.data as RecurringSchedule });
            }}
            height="auto"
          />
        </div>
        )}
      </div>

      {/* Mobile: month-grouped cards */}
      <div className="md:hidden">
        {events.length === 0 ? emptyState : (
          <div className="flex flex-col gap-4">
            {monthGroups.map((group) => (
              <div
                key={group.label}
                className="bg-white overflow-hidden"
                style={{
                  border: "2px solid #1F2024",
                  borderRadius: "10px",
                  boxShadow: "2px 2px 0 #1F2024",
                }}
              >
                <div
                  style={{
                    background: "#1F2024",
                    color: "#fff",
                    fontFamily: "var(--font-pixel-display), ui-monospace, monospace",
                    fontSize: "11px",
                    letterSpacing: "0.12em",
                    padding: "9px 14px",
                  }}
                >
                  {group.label}
                </div>
                <ul>
                  {group.items.map((it, idx) => {
                    const isLast = idx === group.items.length - 1;
                    const contact = it.data.contact;
                    const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
                    const dot = getAvatarColor(name).bg;
                    const days = differenceInCalendarDays(it.date, new Date());
                    const overdue = days < 0;
                    const upcoming = days >= 0 && days <= 3;
                    let trailing: React.ReactNode;
                    if (overdue) {
                      trailing = (
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: "11px",
                            padding: "2px 8px",
                            border: "2px solid #1F2024",
                            borderRadius: "8px",
                            background: "#FF6B5E",
                            color: "#fff",
                            boxShadow: "1px 1px 0 #1F2024",
                            flexShrink: 0,
                          }}
                        >
                          Overdue
                        </span>
                      );
                    } else if (upcoming) {
                      trailing = (
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: "11px",
                            padding: "2px 8px",
                            border: "2px solid #1F2024",
                            borderRadius: "8px",
                            background: "#FFE93E",
                            color: "#1F2024",
                            boxShadow: "1px 1px 0 #1F2024",
                            flexShrink: 0,
                          }}
                        >
                          Upcoming
                        </span>
                      );
                    } else {
                      trailing = (
                        <span style={{ fontSize: "11px", color: "#666666", flexShrink: 0 }}>
                          in {days} days
                        </span>
                      );
                    }
                    return (
                      <li
                        key={`${it.kind}-${it.data.id}`}
                        style={{ borderBottom: isLast ? "none" : "1px solid #E8E8E8" }}
                      >
                        <button
                          onClick={() => {
                            if (it.kind === "checkin") setSelected({ kind: "checkin", data: it.data });
                            else if (it.kind === "hangout") setSelected({ kind: "hangout", data: it.data });
                            else setSelected({ kind: "schedule", data: it.data });
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-accent/40 transition-colors"
                        >
                          <span
                            style={{
                              width: "10px",
                              height: "10px",
                              borderRadius: "9999px",
                              border: "1.5px solid #1F2024",
                              background: dot,
                              flexShrink: 0,
                            }}
                          />
                          <span className="flex-1 min-w-0 font-bold text-sm truncate">{name}</span>
                          <span style={{ fontSize: "12px", color: "#666666", flexShrink: 0 }}>
                            {format(it.date, "MMM d")}
                          </span>
                          {trailing}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected?.kind === "checkin" && (
        <CalendarEventModal
          kind="checkin"
          data={selected.data}
          onClose={() => setSelected(null)}
          onUpdate={() => { setSelected(null); load(); }}
        />
      )}
      {selected?.kind === "hangout" && (
        <CalendarEventModal
          kind="hangout"
          data={selected.data}
          onClose={() => setSelected(null)}
          onUpdate={() => { setSelected(null); load(); }}
        />
      )}
      {selected?.kind === "schedule" && (
        <RecurringHangoutDetailModal
          schedule={selected.data}
          onClose={() => setSelected(null)}
          onUpdate={() => { setSelected(null); load(); }}
        />
      )}
    </>
  );
}
