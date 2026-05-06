"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useState, useEffect, useCallback, useMemo } from "react";
import { format, isPast, differenceInCalendarDays } from "date-fns";
import { CalendarEventModal, type CheckInDetail, type HangoutDetail } from "@/components/CalendarEventModal";
import { SunnyDayIllustration } from "./illustrations/SunnyDayIllustration";
import { getAvatarColor } from "@/lib/avatar-color";

// ─── types ────────────────────────────────────────────────────────────────────

type SelectedEvent =
  | { kind: "checkin"; data: CheckInDetail }
  | { kind: "hangout"; data: HangoutDetail };

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

// ─── helpers ──────────────────────────────────────────────────────────────────

function checkInIcon(ci: CheckInDetail): string {
  const cadenceMode = ci.contact.schedule?.cadenceMode;
  return cadenceMode && cadenceMode !== "prompt" ? "🎊" : "💬";
}

function hangoutIcon(h: HangoutDetail): string {
  return h.checkInId ? "🎊" : "🎉";
}

// ─── CalendarView ─────────────────────────────────────────────────────────────

export function CalendarView() {
  const [checkIns, setCheckIns] = useState<CheckInDetail[]>([]);
  const [hangouts, setHangouts] = useState<HangoutDetail[]>([]);
  const [selected, setSelected] = useState<SelectedEvent | null>(null);

  const load = useCallback(async () => {
    const [ciRes, hRes] = await Promise.all([
      fetch("/api/checkins?status=pending"),
      fetch("/api/hangouts"),
    ]);
    if (ciRes.ok) setCheckIns(await ciRes.json());
    if (hRes.ok) {
      const all: HangoutDetail[] = await hRes.json();
      // Only show future, non-completed/skipped hangouts on the calendar
      setHangouts(all.filter((h) => !["completed", "skipped"].includes(h.status) && new Date(h.date) >= new Date(Date.now() - 86400000)));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── build FullCalendar events ────────────────────────────────────────────

  const checkInEvents = checkIns.map((ci) => {
    const name = [ci.contact.firstName, ci.contact.lastName].filter(Boolean).join(" ");
    const overdue = isPast(new Date(ci.scheduledAt));
    const icon = checkInIcon(ci);
    return {
      id: `ci-${ci.id}`,
      title: `${icon} ${name}`,
      date: ci.scheduledAt.split("T")[0],
      extendedProps: { kind: "checkin" as const, data: ci },
      backgroundColor: overdue ? "oklch(0.57 0.22 27)" : getContactColor(ci.contact.id),
      borderColor: "transparent",
      textColor: "oklch(0.985 0.006 80)",
    };
  });

  const hangoutEvents = hangouts.map((h) => {
    const name = [h.contact.firstName, h.contact.lastName].filter(Boolean).join(" ");
    const icon = hangoutIcon(h);
    return {
      id: `h-${h.id}`,
      title: `${icon} ${name}`,
      date: new Date(h.date).toISOString().split("T")[0],
      extendedProps: { kind: "hangout" as const, data: h },
      backgroundColor: "oklch(0.60 0.12 290)",
      borderColor: "transparent",
      textColor: "oklch(0.985 0.006 80)",
    };
  });

  const events = [...checkInEvents, ...hangoutEvents];

  // ── unified mobile list: combine, sort, group by month ──────────────────

  type ListItem =
    | { kind: "checkin"; data: CheckInDetail; date: Date }
    | { kind: "hangout"; data: HangoutDetail; date: Date };

  const monthGroups = useMemo(() => {
    const items: ListItem[] = [
      ...checkIns.map((ci) => ({ kind: "checkin" as const, data: ci, date: new Date(ci.scheduledAt) })),
      ...hangouts.map((h) => ({ kind: "hangout" as const, data: h, date: new Date(h.date) })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    const groups = new Map<string, { label: string; items: ListItem[] }>();
    for (const it of items) {
      const key = format(it.date, "yyyy-MM");
      const label = format(it.date, "MMM yyyy").toUpperCase();
      if (!groups.has(key)) groups.set(key, { label, items: [] });
      groups.get(key)!.items.push(it);
    }
    return Array.from(groups.values());
  }, [checkIns, hangouts]);

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
          <span className="flex items-center gap-1"><span>💬</span> Message check-in</span>
          <span className="flex items-center gap-1"><span>🎉</span> One-time hangout</span>
          <span className="flex items-center gap-1"><span>🎊</span> Recurring hangout</span>
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
            events={events}
            eventClick={(info) => {
              const ep = info.event.extendedProps as { kind: "checkin" | "hangout"; data: CheckInDetail | HangoutDetail };
              if (ep.kind === "checkin") setSelected({ kind: "checkin", data: ep.data as CheckInDetail });
              else setSelected({ kind: "hangout", data: ep.data as HangoutDetail });
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
                          onClick={() =>
                            setSelected(
                              it.kind === "checkin"
                                ? { kind: "checkin", data: it.data }
                                : { kind: "hangout", data: it.data },
                            )
                          }
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
      {selected && (
        selected.kind === "checkin" ? (
          <CalendarEventModal
            kind="checkin"
            data={selected.data}
            onClose={() => setSelected(null)}
            onUpdate={() => { setSelected(null); load(); }}
          />
        ) : (
          <CalendarEventModal
            kind="hangout"
            data={selected.data}
            onClose={() => setSelected(null)}
            onUpdate={() => { setSelected(null); load(); }}
          />
        )
      )}
    </>
  );
}
