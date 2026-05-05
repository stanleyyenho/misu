"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useState, useEffect, useCallback } from "react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { CalendarEventModal, type CheckInDetail, type HangoutDetail } from "@/components/CalendarEventModal";
import { Badge } from "@/components/ui/badge";
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

function dateLabel(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  if (isPast(d)) return `Overdue · ${format(d, "MMM d")}`;
  return format(d, "EEE, MMM d");
}

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
        )}
      </div>

      {/* Mobile: scrollable list */}
      <div className="md:hidden">
        {events.length === 0 ? emptyState : (
          <ul className="divide-y">
            {/* check-ins */}
            {checkIns.map((ci) => {
              const name = [ci.contact.firstName, ci.contact.lastName].filter(Boolean).join(" ");
              const overdue = isPast(new Date(ci.scheduledAt));
              const color = getAvatarColor(name);
              const icon = checkInIcon(ci);
              return (
                <li key={`ci-${ci.id}`}>
                  <button
                    onClick={() => setSelected({ kind: "checkin", data: ci })}
                    className="w-full flex items-center gap-3 px-4 py-4 text-left active:bg-accent/40 transition-colors"
                  >
                    <div
                      className="h-11 w-11 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: color.bg }}
                    >
                      <span className="text-sm font-bold" style={{ color: color.fg }}>
                        {ci.contact.firstName[0]}{ci.contact.lastName?.[0] ?? ""}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{icon} {name}</p>
                      <p className={`text-sm font-semibold ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                        {dateLabel(ci.scheduledAt)}
                      </p>
                    </div>
                    {overdue && <Badge variant="destructive" className="shrink-0 text-xs rounded-full">Overdue</Badge>}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-muted-foreground shrink-0">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </li>
              );
            })}
            {/* hangouts */}
            {hangouts.map((h) => {
              const name = [h.contact.firstName, h.contact.lastName].filter(Boolean).join(" ");
              const color = getAvatarColor(name);
              const icon = hangoutIcon(h);
              return (
                <li key={`h-${h.id}`}>
                  <button
                    onClick={() => setSelected({ kind: "hangout", data: h })}
                    className="w-full flex items-center gap-3 px-4 py-4 text-left active:bg-accent/40 transition-colors"
                  >
                    <div
                      className="h-11 w-11 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: color.bg }}
                    >
                      <span className="text-sm font-bold" style={{ color: color.fg }}>
                        {h.contact.firstName[0]}{h.contact.lastName?.[0] ?? ""}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{icon} {name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(h.date), "EEE, MMM d 'at' h:mm a")}
                        {h.type === "in-person" && h.locationName ? ` · ${h.locationName}` : ""}
                        {h.type === "digital" && h.platform ? ` · ${h.platform}` : ""}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs" style={{ borderRadius: "8px" }}>
                      {h.status}
                    </Badge>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-muted-foreground shrink-0">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
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
