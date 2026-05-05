"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { format, isToday, isTomorrow, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { getAvatarColor } from "@/lib/avatar-color";
import { MessagePreview } from "@/components/MessagePreview";
import { SunnyDayIllustration } from "@/components/illustrations/SunnyDayIllustration";

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
    } | null;
  };
}

interface RecentActivity {
  id: string;
  scheduledAt: string;
  completedAt: string | null;
  status: string;
  format: string | null;
  contact: {
    firstName: string;
    lastName: string | null;
  };
}

interface DashboardHangout {
  id: string;
  type: string;
  status: string;
  date: string;
  locationName: string | null;
  platform: string | null;
  contact: { id: string; firstName: string; lastName: string | null };
}

interface DashboardData {
  upcoming: UpcomingCheckIn[];
  recent: RecentActivity[];
  profile: { firstName: string | null } | null;
  upcomingHangouts: DashboardHangout[];
  awaitingCompletion: DashboardHangout[];
}

const PLATFORM_LABELS: Record<string, string> = {
  sms: "SMS",
  imessage: "iMessage",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  messenger: "Messenger",
};

const PLATFORM_COLORS: Record<string, string> = {
  sms: "var(--splash-yellow)",
  imessage: "var(--splash-mint)",
  whatsapp: "var(--splash-turquoise)",
  instagram: "var(--splash-pink)",
  messenger: "var(--splash-sky)",
};

function getGreeting(firstName: string | null): string {
  const hour = new Date().getHours();
  const time =
    hour >= 5 && hour < 12 ? "good morning" :
    hour >= 12 && hour < 17 ? "good afternoon" :
    hour >= 17 && hour < 21 ? "good evening" :
    "good night";
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

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("fetch error");
    return r.json();
  });

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
        className="rounded-[10px] border-2 border-[#1F2024] bg-card p-4 flex items-center gap-3"
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
          <button
            onClick={() => handle("complete")}
            disabled={!!loading}
            className="text-xs font-bold px-2.5 py-1.5 border-2 border-[#1F2024] bg-[#1F2024] text-white"
            style={{ borderRadius: "8px", boxShadow: "2px 2px 0 #1F2024", opacity: loading ? 0.6 : 1 }}
          >
            {loading === "complete" ? "..." : "Done"}
          </button>
          <button
            onClick={() => handle("skip")}
            disabled={!!loading}
            className="text-xs font-bold px-2.5 py-1.5 border-2 border-[#1F2024]"
            style={{ borderRadius: "8px", opacity: loading ? 0.6 : 1 }}
          >
            {loading === "skip" ? "..." : "Skip"}
          </button>
        </div>
      </div>
    </li>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error, mutate } = useSWR<DashboardData>("/api/dashboard", fetcher);
  const [activeCheckIn, setActiveCheckIn] = useState<UpcomingCheckIn | null>(null);

  if (error) toast.error("Failed to load check-ins");

  const upcoming = data?.upcoming ?? [];
  const recent = data?.recent ?? [];
  const firstName = data?.profile?.firstName ?? null;
  const upcomingHangouts = data?.upcomingHangouts ?? [];
  const awaitingCompletion = data?.awaitingCompletion ?? [];

  return (
    <div className="max-w-[480px] mx-auto px-4 pt-5 pb-24 md:pb-6">
      {/* Header */}
      <div className="mb-6">
        <p
          style={{
            fontFamily: "var(--font-pixel-display)",
            fontSize: "11px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--muted-foreground)",
          }}
        >
          dashboard
        </p>
        <h1
          className="text-2xl font-semibold mt-0.5"
          style={{ fontFamily: "var(--font-script)" }}
        >
          {getGreeting(firstName)}{" "}who do you want to check in with?
        </h1>
      </div>

      {/* Upcoming check-ins */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <p
            style={{
              fontFamily: "var(--font-pixel-display)",
              fontSize: "11px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--muted-foreground)",
            }}
          >
            up next
          </p>
          <Link
            href="/calendar"
            className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            see all →
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 rounded-[10px] border-2 border-[#1F2024] bg-secondary animate-pulse"
                style={{ boxShadow: "4px 4px 0 #1F2024" }}
              />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <div
            className="rounded-[10px] border-2 border-[#1F2024] bg-card p-6 flex flex-col items-center gap-3 text-center"
            style={{ boxShadow: "4px 4px 0 #1F2024" }}
          >
            <SunnyDayIllustration size={72} />
            <div>
              <p className="font-bold text-foreground">all caught up!</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                No check-ins due in the next two weeks.
              </p>
            </div>
            <Link
              href="/contacts"
              className="text-sm font-bold underline underline-offset-2"
            >
              Add a contact
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((ci) => {
              const name = [ci.contact.firstName, ci.contact.lastName].filter(Boolean).join(" ");
              const color = getAvatarColor(name);
              const platform = ci.contact.messagingPlatform;
              const isOverdue = differenceInDays(new Date(ci.scheduledAt), new Date()) < 0;

              return (
                <li key={ci.id}>
                  <div
                    className="rounded-[10px] border-2 border-[#1F2024] bg-card p-4 flex items-center gap-3"
                    style={{ boxShadow: "4px 4px 0 #1F2024" }}
                  >
                    {/* Avatar */}
                    <div
                      className="h-11 w-11 rounded-full border-2 border-[#1F2024] flex items-center justify-center shrink-0 crosshatch-light"
                      style={{ backgroundColor: color.bg }}
                    >
                      <span className="text-sm font-bold" style={{ color: color.fg }}>
                        {ci.contact.firstName[0]}{ci.contact.lastName?.[0] ?? ""}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold truncate">{name}</p>
                        {platform && (
                          <span
                            className="text-[11px] font-bold px-2 py-0.5 border-2 border-[#1F2024] shrink-0"
                            style={{
                              borderRadius: "8px",
                              backgroundColor: PLATFORM_COLORS[platform] ?? "var(--accent)",
                              boxShadow: "1px 1px 0 #1F2024",
                              fontFamily: "var(--font-sans)",
                            }}
                          >
                            {PLATFORM_LABELS[platform] ?? platform}
                          </span>
                        )}
                      </div>
                      <p
                        className="text-xs font-semibold mt-0.5"
                        style={{ color: dueDateColor(ci.scheduledAt) }}
                      >
                        {dueDateLabel(ci.scheduledAt)}
                        {isOverdue && " — overdue"}
                      </p>
                    </div>

                    {/* Action */}
                    <button
                      onClick={() => setActiveCheckIn(ci)}
                      className="shrink-0 text-sm font-bold px-3 py-2 border-2 border-[#1F2024] bg-[#1F2024] text-white transition-all hover:-translate-x-px hover:-translate-y-px active:translate-x-px active:translate-y-px"
                      style={{
                        borderRadius: "8px",
                        boxShadow: "2px 2px 0 #1F2024",
                        fontFamily: "var(--font-sans)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "3px 3px 0 #1F2024")}
                      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "2px 2px 0 #1F2024")}
                    >
                      send
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Awaiting completion */}
      {awaitingCompletion.length > 0 && (
        <section className="mb-8">
          <p
            className="mb-3"
            style={{ fontFamily: "var(--font-pixel-display)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted-foreground)" }}
          >
            did you go?
          </p>
          <ul className="space-y-3">
            {awaitingCompletion.map((h) => (
              <HangoutCompletionCard key={h.id} hangout={h} onUpdated={() => mutate()} />
            ))}
          </ul>
        </section>
      )}

      {/* Upcoming confirmed hangouts */}
      {upcomingHangouts.length > 0 && (
        <section className="mb-8">
          <p
            className="mb-3"
            style={{ fontFamily: "var(--font-pixel-display)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted-foreground)" }}
          >
            confirmed hangouts
          </p>
          <ul className="space-y-3">
            {upcomingHangouts.map((h) => {
              const name = [h.contact.firstName, h.contact.lastName].filter(Boolean).join(" ");
              const color = getAvatarColor(name);
              return (
                <li key={h.id}>
                  <Link href={`/contacts/${h.contact.id}`}>
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
                          {h.type === "digital" && h.platform ? ` · ${h.platform}` : ""}
                        </p>
                      </div>
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 border-2 border-[#1F2024] shrink-0"
                        style={{ borderRadius: "8px", backgroundColor: "var(--splash-mint)", boxShadow: "1px 1px 0 #1F2024" }}
                      >
                        {h.status}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Recent activity */}
      {recent.length > 0 && (
        <section>
          <p
            className="mb-3"
            style={{
              fontFamily: "var(--font-pixel-display)",
              fontSize: "11px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--muted-foreground)",
            }}
          >
            recent activity
          </p>
          <ul className="space-y-2">
            {recent.map((ci) => {
              const name = [ci.contact.firstName, ci.contact.lastName].filter(Boolean).join(" ");
              return (
                <li
                  key={ci.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] border border-[#DEDEDE] bg-card text-sm"
                >
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      ci.status === "completed" ? "bg-[var(--splash-mint)]" : "bg-[var(--muted)]"
                    }`}
                    style={{ border: "1.5px solid #1F2024" }}
                  />
                  <span className="flex-1 font-semibold truncate">{name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {ci.completedAt
                      ? format(new Date(ci.completedAt), "MMM d")
                      : format(new Date(ci.scheduledAt), "MMM d")}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 border border-[#1F2024] shrink-0`}
                    style={{
                      borderRadius: "8px",
                      backgroundColor: ci.status === "completed" ? "var(--splash-mint)" : "var(--secondary)",
                    }}
                  >
                    {ci.status}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Message generation sheet */}
      {activeCheckIn && (
        <MessagePreview
          checkIn={activeCheckIn}
          onClose={() => { setActiveCheckIn(null); mutate(); }}
        />
      )}
    </div>
  );
}
