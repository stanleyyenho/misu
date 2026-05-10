"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import useSWR from "swr";
import { format, isToday, isTomorrow, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { getAvatarColor } from "@/lib/avatar-color";
import { MessagePreview } from "@/components/MessagePreview";
import { RecurringHangoutDetailModal, type RecurringSchedule } from "@/components/RecurringHangoutDetailModal";
import { CalendarEventModal, type CheckInDetail, type HangoutDetail } from "@/components/CalendarEventModal";
import { AddRecurringHangoutSheet } from "@/components/AddRecurringHangoutSheet";
import { AddOneTimeHangoutSheet } from "@/components/AddOneTimeHangoutSheet";
import { AddCheckInSheet } from "@/components/AddCheckInSheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ActionButton } from "@/components/ui/action-button";

// ─── types ────────────────────────────────────────────────────────────────────

interface UpcomingCheckIn {
  id: string;
  scheduledAt: string;
  status: string;
  contact: {
    id: string;
    firstName: string;
    lastName: string | null;
    phone: string | null;
    messagingPlatform: string | null;
    notes: string | null;
    schedule: {
      tone: string;
      checkInType: string;
      approveBeforeSend: boolean;
      frequencyDays: number;
      cadenceMode: string;
    } | null;
  };
}

interface DashboardHangout {
  id: string;
  type: string;
  status: string;
  date: string;
  locationName: string | null;
  locationAddr: string | null;
  platform: string | null;
  meetingLink: string | null;
  noteToFriend: string | null;
  checkInId: string | null;
  contact: { id: string; firstName: string; lastName: string | null; phone: string | null };
}

interface RecentActivity {
  id: string;
  scheduledAt: string;
  completedAt: string | null;
  status: string;
  format: string | null;
  contact: { firstName: string; lastName: string | null };
  hangout: {
    type: string;
    locationName: string | null;
    platform: string | null;
    checkInId: string | null;
  } | null;
}

interface NeedsVenueHangout extends DashboardHangout {
  locationTbdAt: string | null;
}

interface DashboardData {
  recurringSchedules: RecurringSchedule[];
  messageCheckIns: UpcomingCheckIn[];
  oneTimeHangouts: DashboardHangout[];
  awaitingCompletion: DashboardHangout[];
  needsVenue: NeedsVenueHangout[];
  recent: RecentActivity[];
  profile: { firstName: string | null } | null;
}

// ─── constants ────────────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  sms: "var(--splash-yellow)", imessage: "var(--splash-mint)",
  whatsapp: "var(--splash-turquoise)", instagram: "var(--splash-pink)",
  messenger: "var(--splash-sky)",
};

const PLATFORM_LABELS: Record<string, string> = {
  sms: "SMS", imessage: "iMessage", whatsapp: "WhatsApp",
  instagram: "Instagram", messenger: "Messenger",
};

const HANGOUT_PLATFORM_LABELS: Record<string, string> = {
  facetime: "FaceTime", zoom: "Zoom", "google-meet": "Google Meet",
  teams: "Teams", other: "Video call",
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function getGreeting(firstName: string | null): string {
  const hour = new Date().getHours();
  const time =
    hour >= 5 && hour < 12 ? "good morning" :
    hour >= 12 && hour < 17 ? "good afternoon" :
    hour >= 17 && hour < 21 ? "good evening" : "good night";
  return firstName ? `${time}, ${firstName}!` : `${time}!`;
}

function dueDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return "today";
  if (isTomorrow(d)) return "tomorrow";
  const diff = differenceInDays(d, new Date());
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  return `in ${diff}d`;
}

function dueDateColor(dateStr: string) {
  const d = new Date(dateStr);
  if (differenceInDays(d, new Date()) < 0) return "var(--destructive)";
  if (isToday(d)) return "var(--splash-orange)";
  return "var(--muted-foreground)";
}

function activityTypeLabel(item: RecentActivity): string {
  if (item.hangout) {
    if (item.hangout.checkInId) return "Recurring hangout";
    return "One-time hangout";
  }
  return "Check-in message";
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("fetch error");
    return r.json();
  });

// ─── section header ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: "var(--font-pixel-display)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
      {children}
    </p>
  );
}

function ScheduleSomethingButton({
  onRecurringHangout,
  onOneTimeHangout,
  onRecurringCheckIn,
}: {
  onRecurringHangout: () => void;
  onOneTimeHangout: () => void;
  onRecurringCheckIn: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expanded) return;
    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [expanded]);

  function pick(handler: () => void) {
    return () => {
      setExpanded(false);
      handler();
    };
  }

  return (
    <div ref={containerRef} className="w-full">
      {!expanded ? (
        <ActionButton
          onClick={() => setExpanded(true)}
          className="w-full py-3"
        >
          + Schedule something!
        </ActionButton>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={pick(onRecurringHangout)}
            className="text-[11px] font-bold leading-tight px-2 py-2.5 border-2 border-[#1F2024] bg-card transition-all hover:-translate-x-px hover:-translate-y-px active:translate-x-px active:translate-y-px"
            style={{ borderRadius: "10px", boxShadow: "3px 3px 0 #1F2024", backgroundColor: "var(--splash-mint)" }}
          >
            Recurring<br />Hangout
          </button>
          <button
            onClick={pick(onOneTimeHangout)}
            className="text-[11px] font-bold leading-tight px-2 py-2.5 border-2 border-[#1F2024] transition-all hover:-translate-x-px hover:-translate-y-px active:translate-x-px active:translate-y-px"
            style={{ borderRadius: "10px", boxShadow: "3px 3px 0 #1F2024", backgroundColor: "var(--splash-yellow)" }}
          >
            One-Time<br />Hangout
          </button>
          <button
            onClick={pick(onRecurringCheckIn)}
            className="text-[11px] font-bold leading-tight px-2 py-2.5 border-2 border-[#1F2024] transition-all hover:-translate-x-px hover:-translate-y-px active:translate-x-px active:translate-y-px"
            style={{ borderRadius: "10px", boxShadow: "3px 3px 0 #1F2024", backgroundColor: "var(--splash-pink)" }}
          >
            Recurring<br />Check-In
          </button>
        </div>
      )}
    </div>
  );
}

// ─── needs-a-venue card ───────────────────────────────────────────────────────

function NeedsVenueCard({
  hangout,
  onClick,
}: {
  hangout: NeedsVenueHangout;
  onClick: () => void;
}) {
  const name = [hangout.contact.firstName, hangout.contact.lastName].filter(Boolean).join(" ");
  const color = getAvatarColor(name);
  const tbdSent = !!hangout.locationTbdAt;

  return (
    <li>
      <button className="w-full text-left" onClick={onClick}>
        <div
          className="rounded-[10px] border-2 border-[#1F2024] bg-[var(--splash-pink)]/25 p-4 flex items-center gap-3"
          style={{ boxShadow: "4px 4px 0 #1F2024" }}
        >
          <div
            className="h-11 w-11 rounded-full border-2 border-[#1F2024] flex items-center justify-center shrink-0 crosshatch-light"
            style={{ backgroundColor: color.bg }}
          >
            <span className="text-sm font-bold" style={{ color: color.fg }}>
              {hangout.contact.firstName[0]}{hangout.contact.lastName?.[0] ?? ""}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate">{name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(hangout.date), "EEE, MMM d 'at' h:mm a")}
            </p>
            <p className="text-[11px] font-bold mt-0.5" style={{ color: "var(--destructive)" }}>
              {tbdSent ? "Invite sent as TBD — tap to set venue" : "Pick a venue"}
            </p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-muted-foreground shrink-0">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </button>
    </li>
  );
}

// ─── awaiting completion card ─────────────────────────────────────────────────

function HangoutCompletionCard({ hangout, onUpdated }: { hangout: DashboardHangout; onUpdated: () => void }) {
  const [loading, setLoading] = useState<"complete" | "skip" | null>(null);
  const name = [hangout.contact.firstName, hangout.contact.lastName].filter(Boolean).join(" ");
  const color = getAvatarColor(name);

  async function handle(action: "complete" | "skip") {
    setLoading(action);
    try {
      const res = await fetch(`/api/hangouts/${hangout.id}/${action}`, { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success(action === "complete" ? `Marked hangout with ${name} as done!` : "Hangout skipped.");
      onUpdated();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  return (
    <li>
      <div
        className="rounded-[10px] border-2 border-[#1F2024] bg-[var(--splash-yellow)]/20 p-4 flex items-center gap-3"
        style={{ boxShadow: "4px 4px 0 #1F2024" }}
      >
        <div
          className="h-11 w-11 rounded-full border-2 border-[#1F2024] flex items-center justify-center shrink-0 crosshatch-light"
          style={{ backgroundColor: color.bg }}
        >
          <span className="text-sm font-bold" style={{ color: color.fg }}>
            {hangout.contact.firstName[0]}{hangout.contact.lastName?.[0] ?? ""}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate">{name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(hangout.date), "EEE, MMM d 'at' h:mm a")}
            {hangout.type === "in-person" && hangout.locationName ? ` · ${hangout.locationName}` : ""}
          </p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <ActionButton size="sm" onClick={() => handle("complete")} disabled={!!loading}>
            {loading === "complete" ? "..." : "Done"}
          </ActionButton>
          <ActionButton size="sm" variant="outline" onClick={() => handle("skip")} disabled={!!loading} style={{ boxShadow: "none" }}>
            {loading === "skip" ? "..." : "Skip"}
          </ActionButton>
        </div>
      </div>
    </li>
  );
}

// ─── recent activity detail modal ────────────────────────────────────────────

function ActivityDetailModal({ item, onClose }: { item: RecentActivity; onClose: () => void }) {
  const name = [item.contact.firstName, item.contact.lastName].filter(Boolean).join(" ");
  const date = item.completedAt ?? item.scheduledAt;
  const typeLabel = activityTypeLabel(item);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:w-full max-sm:max-w-full">
        <div className="flex justify-center -mt-1 mb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <div
            className="rounded-[10px] border-2 border-[#1F2024] p-4 space-y-2"
            style={{ boxShadow: "2px 2px 0 #1F2024" }}
          >
            <p className="text-sm font-bold">{format(new Date(date), "EEEE, MMMM d, yyyy")}</p>
            {item.completedAt && (
              <p className="text-xs text-muted-foreground">
                at {format(new Date(item.completedAt), "h:mm a")}
              </p>
            )}
            <p className="text-sm text-muted-foreground font-semibold">{typeLabel}</p>
            {item.hangout?.type === "in-person" && item.hangout.locationName && (
              <p className="text-sm text-muted-foreground">
                📍 {item.hangout.locationName}
              </p>
            )}
            {item.hangout?.type === "digital" && item.hangout.platform && (
              <p className="text-sm text-muted-foreground">
                💻 {HANGOUT_PLATFORM_LABELS[item.hangout.platform] ?? item.hangout.platform}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-[11px] font-bold px-2 py-0.5 border border-[#1F2024]"
              style={{
                borderRadius: "8px",
                backgroundColor: item.status === "completed" ? "var(--splash-mint)" : "var(--muted)",
              }}
            >
              {item.status}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const { data, isLoading, error, mutate } = useSWR<DashboardData>(
    "/api/dashboard",
    fetcher,
    { fallbackData: initialData },
  );

  const [activeCheckIn, setActiveCheckIn] = useState<UpcomingCheckIn | null>(null);
  const [activeHangoutDetail, setActiveHangoutDetail] = useState<HangoutDetail | null>(null);
  const [activeRecurring, setActiveRecurring] = useState<RecurringSchedule | null>(null);
  const [activeActivity, setActiveActivity] = useState<RecentActivity | null>(null);

  const [addRecurringOpen, setAddRecurringOpen] = useState(false);
  const [addOneTimeOpen, setAddOneTimeOpen] = useState(false);
  const [addCheckInOpen, setAddCheckInOpen] = useState(false);

  if (error) toast.error("Failed to load dashboard");

  const recurringSchedules = data?.recurringSchedules ?? [];
  const messageCheckIns = data?.messageCheckIns ?? [];
  const oneTimeHangouts = data?.oneTimeHangouts ?? [];
  const awaitingCompletion = data?.awaitingCompletion ?? [];
  const needsVenue = data?.needsVenue ?? [];
  const recent = data?.recent ?? [];
  const firstName = data?.profile?.firstName ?? null;

  // Deep-link: ?openHangout=<id> (used by venue-prompt push notifs)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = new URLSearchParams(window.location.search).get("openHangout");
    if (!id) return;
    let cancelled = false;
    fetch(`/api/hangouts/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((h) => {
        if (cancelled || !h) return;
        setActiveHangoutDetail(h as HangoutDetail);
        window.history.replaceState({}, "", "/");
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="max-w-[480px] mx-auto px-4 pt-5 pb-24 md:pb-6">
      {/* Header */}
      <div className="mb-6">
        <p style={{ fontFamily: "var(--font-pixel-display)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
          dashboard
        </p>
        <h1 className="text-2xl font-semibold mt-0.5" style={{ fontFamily: "var(--font-script)" }}>
          {getGreeting(firstName)}{" "}who are you seeing?
        </h1>
      </div>

      {/* Schedule something */}
      <div className="mb-6">
        <ScheduleSomethingButton
          onRecurringHangout={() => setAddRecurringOpen(true)}
          onOneTimeHangout={() => setAddOneTimeOpen(true)}
          onRecurringCheckIn={() => setAddCheckInOpen(true)}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1: HANGOUTS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <SectionLabel>hangouts</SectionLabel>
        </div>

        {/* Needs a venue */}
        {needsVenue.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Needs a venue</p>
            <ul className="space-y-3">
              {needsVenue.map((h) => (
                <NeedsVenueCard
                  key={h.id}
                  hangout={h}
                  onClick={() => setActiveHangoutDetail(h as HangoutDetail)}
                />
              ))}
            </ul>
          </div>
        )}

        {/* Awaiting completion */}
        {awaitingCompletion.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Did you go?</p>
            <ul className="space-y-3">
              {awaitingCompletion.map((h) => (
                <HangoutCompletionCard key={h.id} hangout={h} onUpdated={() => mutate()} />
              ))}
            </ul>
          </div>
        )}

        {/* 1a — Recurring */}
        <div className="mb-5">
          <div className="mb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recurring</p>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="h-[72px] rounded-[10px] border-2 border-[#1F2024] bg-secondary animate-pulse" style={{ boxShadow: "4px 4px 0 #1F2024" }} />
              ))}
            </div>
          ) : recurringSchedules.length === 0 ? (
            <div className="rounded-[10px] border-2 border-dashed border-[#DEDEDE] p-4 text-center">
              <p className="text-sm text-muted-foreground">No recurring hangouts set up yet.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {recurringSchedules.map((s) => {
                const name = [s.contact.firstName, s.contact.lastName].filter(Boolean).join(" ");
                const color = getAvatarColor(name);
                const nextDate = new Date(s.nextCheckIn);

                return (
                  <li key={s.id}>
                    <button
                      className="w-full text-left"
                      onClick={() => setActiveRecurring(s)}
                    >
                      <div
                        className="rounded-[10px] border-2 border-[#1F2024] bg-card p-4 flex items-center gap-3"
                        style={{ boxShadow: "4px 4px 0 #1F2024" }}
                      >
                        <div
                          className="h-11 w-11 rounded-full border-2 border-[#1F2024] flex items-center justify-center shrink-0 crosshatch-light"
                          style={{ backgroundColor: color.bg }}
                        >
                          <span className="text-sm font-bold" style={{ color: color.fg }}>
                            {s.contact.firstName[0]}{s.contact.lastName?.[0] ?? ""}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{name}</p>
                          <p className="text-xs font-semibold mt-0.5" style={{ color: dueDateColor(s.nextCheckIn) }}>
                            {format(nextDate, "MMM d, yyyy")} · {dueDateLabel(s.nextCheckIn)}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 font-semibold">
                            Every {s.frequencyDays}d
                            {" · "}
                            {s.hangoutType === "in-person" ? "In-person" : "Digital"}
                          </p>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-muted-foreground shrink-0">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* 1b — One-time */}
        <div>
          <div className="mb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">One-time</p>
          </div>

          {isLoading ? (
            <div className="h-[72px] rounded-[10px] border-2 border-[#1F2024] bg-secondary animate-pulse" style={{ boxShadow: "4px 4px 0 #1F2024" }} />
          ) : oneTimeHangouts.length === 0 ? (
            <div className="rounded-[10px] border-2 border-dashed border-[#DEDEDE] p-4 text-center">
              <p className="text-sm text-muted-foreground">No one-time hangouts coming up.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {oneTimeHangouts.map((h) => {
                const name = [h.contact.firstName, h.contact.lastName].filter(Boolean).join(" ");
                const color = getAvatarColor(name);

                return (
                  <li key={h.id}>
                    <button
                      className="w-full text-left"
                      onClick={() => setActiveHangoutDetail(h as HangoutDetail)}
                    >
                      <div
                        className="rounded-[10px] border-2 border-[#1F2024] bg-card p-4 flex items-center gap-3"
                        style={{ boxShadow: "4px 4px 0 #1F2024" }}
                      >
                        <div
                          className="h-11 w-11 rounded-full border-2 border-[#1F2024] flex items-center justify-center shrink-0 crosshatch-light"
                          style={{ backgroundColor: color.bg }}
                        >
                          <span className="text-sm font-bold" style={{ color: color.fg }}>
                            {h.contact.firstName[0]}{h.contact.lastName?.[0] ?? ""}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(h.date), "EEE, MMM d 'at' h:mm a")}
                            {h.type === "in-person" && h.locationName ? ` · ${h.locationName}` : ""}
                            {h.type === "digital" && h.platform ? ` · ${HANGOUT_PLATFORM_LABELS[h.platform] ?? h.platform}` : ""}
                          </p>
                        </div>
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 border-2 border-[#1F2024] shrink-0"
                          style={{ borderRadius: "8px", backgroundColor: "var(--splash-mint)", boxShadow: "1px 1px 0 #1F2024" }}
                        >
                          {h.status}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2: CHECK-IN MESSAGES
      ══════════════════════════════════════════════════════════════════ */}
      <section className="mb-10">
        <div className="mb-4">
          <SectionLabel>check-in messages</SectionLabel>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-[72px] rounded-[10px] border-2 border-[#1F2024] bg-secondary animate-pulse" style={{ boxShadow: "4px 4px 0 #1F2024" }} />
            ))}
          </div>
        ) : messageCheckIns.length === 0 ? (
          <div className="rounded-[10px] border-2 border-dashed border-[#DEDEDE] p-4 text-center">
            <p className="text-sm text-muted-foreground">No check-in messages scheduled.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {messageCheckIns.map((ci) => {
              const name = [ci.contact.firstName, ci.contact.lastName].filter(Boolean).join(" ");
              const color = getAvatarColor(name);
              const platform = ci.contact.messagingPlatform;
              const freq = ci.contact.schedule?.frequencyDays;
              const isOverdue = differenceInDays(new Date(ci.scheduledAt), new Date()) < 0;

              return (
                <li key={ci.id}>
                  <div
                    className="rounded-[10px] border-2 border-[#1F2024] bg-card p-4 flex items-center gap-3"
                    style={{ boxShadow: "4px 4px 0 #1F2024" }}
                  >
                    <div
                      className="h-11 w-11 rounded-full border-2 border-[#1F2024] flex items-center justify-center shrink-0 crosshatch-light"
                      style={{ backgroundColor: color.bg }}
                    >
                      <span className="text-sm font-bold" style={{ color: color.fg }}>
                        {ci.contact.firstName[0]}{ci.contact.lastName?.[0] ?? ""}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold truncate">{name}</p>
                        {platform && (
                          <span
                            className="text-[11px] font-bold px-2 py-0.5 border-2 border-[#1F2024] shrink-0"
                            style={{ borderRadius: "8px", backgroundColor: PLATFORM_COLORS[platform] ?? "var(--accent)", boxShadow: "1px 1px 0 #1F2024" }}
                          >
                            {PLATFORM_LABELS[platform] ?? platform}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: dueDateColor(ci.scheduledAt) }}>
                        {format(new Date(ci.scheduledAt), "MMM d, yyyy")}{" · "}{dueDateLabel(ci.scheduledAt)}{isOverdue ? " — overdue" : ""}
                      </p>
                      {freq && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 font-semibold">
                          every {freq}d
                        </p>
                      )}
                    </div>
                    <ActionButton
                      size="sm"
                      onClick={() => setActiveCheckIn(ci)}
                      className="shrink-0"
                    >
                      send
                    </ActionButton>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3: RECENT ACTIVITY
      ══════════════════════════════════════════════════════════════════ */}
      {recent.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>recent activity</SectionLabel>
            <Link
              href="/activity"
              className="text-xs font-bold px-2.5 py-1 border-2 border-[#1F2024] bg-card transition-all hover:-translate-x-px hover:-translate-y-px active:translate-x-px active:translate-y-px"
              style={{ borderRadius: "8px", boxShadow: "2px 2px 0 #1F2024" }}
            >
              View all
            </Link>
          </div>
          <ul className="space-y-2">
            {recent.slice(0, 5).map((item) => {
              const name = [item.contact.firstName, item.contact.lastName].filter(Boolean).join(" ");
              const date = item.completedAt ?? item.scheduledAt;
              const typeLabel = activityTypeLabel(item);

              return (
                <li key={item.id}>
                  <button
                    className="w-full text-left"
                    onClick={() => setActiveActivity(item)}
                  >
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] border border-[#DEDEDE] bg-card text-sm hover:bg-accent/10 transition-colors">
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${item.status === "completed" ? "bg-[var(--splash-mint)]" : "bg-[var(--muted)]"}`}
                        style={{ border: "1.5px solid #1F2024" }}
                      />
                      <span className="flex-1 font-semibold truncate">{name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {format(new Date(date), "MMM d")}
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 border border-[#DEDEDE] shrink-0 hidden sm:inline-block"
                        style={{ borderRadius: "8px", backgroundColor: "var(--secondary)" }}
                      >
                        {typeLabel}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ── Modals & sheets ─────────────────────────────────────────────── */}

      {activeCheckIn && (
        <MessagePreview
          checkIn={activeCheckIn}
          onClose={() => { setActiveCheckIn(null); mutate(); }}
        />
      )}

      {activeHangoutDetail && (
        <CalendarEventModal
          kind="hangout"
          data={activeHangoutDetail}
          onClose={() => setActiveHangoutDetail(null)}
          onUpdate={() => { setActiveHangoutDetail(null); mutate(); }}
        />
      )}

      {activeRecurring && (
        <RecurringHangoutDetailModal
          schedule={activeRecurring}
          onClose={() => setActiveRecurring(null)}
          onUpdate={() => { setActiveRecurring(null); mutate(); }}
        />
      )}

      {activeActivity && (
        <ActivityDetailModal
          item={activeActivity}
          onClose={() => setActiveActivity(null)}
        />
      )}

      <AddRecurringHangoutSheet
        open={addRecurringOpen}
        onOpenChange={setAddRecurringOpen}
        onSaved={() => { setAddRecurringOpen(false); mutate(); }}
      />

      <AddOneTimeHangoutSheet
        open={addOneTimeOpen}
        onOpenChange={setAddOneTimeOpen}
        onCreated={() => { setAddOneTimeOpen(false); mutate(); }}
      />

      <AddCheckInSheet
        open={addCheckInOpen}
        onOpenChange={setAddCheckInOpen}
        onSaved={() => { setAddCheckInOpen(false); mutate(); }}
      />
    </div>
  );
}
