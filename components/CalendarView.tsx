"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useState, useEffect, useCallback } from "react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { CheckInModal } from "./CheckInModal";
import { Badge } from "@/components/ui/badge";
import { SunnyDayIllustration } from "./illustrations/SunnyDayIllustration";
import { getAvatarColor } from "@/lib/avatar-color";

interface CheckIn {
  id: string;
  scheduledAt: string;
  status: string;
  contact: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string | null;
    avatarUrl: string | null;
    schedule: { catchupFormats: string } | null;
  };
}

const EVENT_COLORS = [
  "oklch(0.60 0.09 150)",
  "oklch(0.65 0.10 55)",
  "oklch(0.58 0.08 280)",
  "oklch(0.60 0.09 170)",
  "oklch(0.58 0.10 35)",
];

function getEventColor(contactId: string): string {
  let hash = 0;
  for (let i = 0; i < contactId.length; i++)
    hash = (hash * 31 + contactId.charCodeAt(i)) | 0;
  return EVENT_COLORS[Math.abs(hash) % EVENT_COLORS.length];
}

function dateLabel(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  if (isPast(d)) return `Overdue · ${format(d, "MMM d")}`;
  return format(d, "EEE, MMM d");
}

export function CalendarView() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [selected, setSelected] = useState<CheckIn | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/checkins?status=pending");
    const data = await res.json();
    if (res.ok) setCheckIns(data);
    else console.error("[CalendarView] API error:", data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const events = checkIns.map((ci) => {
    const name = [ci.contact.firstName, ci.contact.lastName].filter(Boolean).join(" ");
    const overdue = isPast(new Date(ci.scheduledAt));
    return {
      id: ci.id,
      title: name,
      date: ci.scheduledAt.split("T")[0],
      extendedProps: { checkIn: ci },
      backgroundColor: overdue ? "oklch(0.57 0.22 27)" : getEventColor(ci.contact.id),
      borderColor: "transparent",
      textColor: "oklch(0.985 0.006 80)",
    };
  });

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

  return (
    <>
      {/* Desktop: full calendar */}
      <div className="hidden md:block">
        {checkIns.length === 0 ? emptyState : (
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,dayGridWeek" }}
            events={events}
            eventClick={(info) => setSelected(info.event.extendedProps.checkIn as CheckIn)}
            height="auto"
          />
        )}
      </div>

      {/* Mobile: scrollable list */}
      <div className="md:hidden">
        {checkIns.length === 0 ? emptyState : (
          <ul className="divide-y">
            {checkIns.map((ci) => {
              const name = [ci.contact.firstName, ci.contact.lastName].filter(Boolean).join(" ");
              const overdue = isPast(new Date(ci.scheduledAt));
              const color = getAvatarColor(name);
              return (
                <li key={ci.id}>
                  <button
                    onClick={() => setSelected(ci)}
                    className="w-full flex items-center gap-3 px-4 py-4 text-left active:bg-accent/40 transition-colors"
                  >
                    <div
                      className="h-11 w-11 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                      style={{ backgroundColor: ci.contact.avatarUrl ? undefined : color.bg }}
                    >
                      {ci.contact.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ci.contact.avatarUrl} alt={name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold" style={{ color: color.fg }}>
                          {ci.contact.firstName[0]}{ci.contact.lastName?.[0] ?? ""}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{name}</p>
                      <p className={`text-sm font-semibold ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                        {dateLabel(ci.scheduledAt)}
                      </p>
                    </div>
                    {overdue && (
                      <Badge variant="destructive" className="shrink-0 text-xs rounded-full">Overdue</Badge>
                    )}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth={2} className="text-muted-foreground shrink-0">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selected && (
        <CheckInModal
          checkIn={selected}
          onClose={() => setSelected(null)}
          onUpdate={() => { setSelected(null); load(); }}
        />
      )}
    </>
  );
}
