"use client";

import { useEffect, useState } from "react";
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

export default function DashboardPage() {
  const [upcoming, setUpcoming] = useState<UpcomingCheckIn[]>([]);
  const [recent, setRecent] = useState<RecentActivity[]>([]);
  const [activeCheckIn, setActiveCheckIn] = useState<UpcomingCheckIn | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [upcomingRes, recentRes] = await Promise.all([
        fetch("/api/checkins?status=pending&days=14"),
        fetch("/api/checkins?status=completed&limit=5"),
      ]);
      const [upcomingData, recentData] = await Promise.all([
        upcomingRes.json(),
        recentRes.json(),
      ]);
      setUpcoming(Array.isArray(upcomingData) ? upcomingData : []);
      setRecent(Array.isArray(recentData) ? recentData : []);
    } catch {
      toast.error("Failed to load check-ins");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

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
          who do you want to reach out to?
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

        {loading ? (
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
          onClose={() => { setActiveCheckIn(null); load(); }}
        />
      )}
    </div>
  );
}
