"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { format } from "date-fns";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ActivityItem {
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

const HANGOUT_PLATFORM_LABELS: Record<string, string> = {
  facetime: "FaceTime",
  zoom: "Zoom",
  "google-meet": "Google Meet",
  teams: "Teams",
  other: "Video call",
};

const FORMAT_OPTIONS = [
  { value: "", label: "All formats" },
  { value: "message", label: "Check-in message" },
  { value: "in-person", label: "In-person hangout" },
  { value: "digital", label: "Digital (any)" },
  { value: "facetime", label: "Digital · FaceTime" },
  { value: "zoom", label: "Digital · Zoom" },
  { value: "google-meet", label: "Digital · Google Meet" },
  { value: "teams", label: "Digital · Teams" },
  { value: "other", label: "Digital · Other" },
];

function activityTypeLabel(item: ActivityItem): string {
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

function ActivityDetailModal({ item, onClose }: { item: ActivityItem; onClose: () => void }) {
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
              <p className="text-sm text-muted-foreground">📍 {item.hangout.locationName}</p>
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

export default function ActivityPage() {
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [location, setLocation] = useState("");
  const [formatFilter, setFormatFilter] = useState("");
  const [active, setActive] = useState<ActivityItem | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (location) params.set("location", location);
    if (formatFilter) params.set("format", formatFilter);
    const s = params.toString();
    return s ? `?${s}` : "";
  }, [q, dateFrom, dateTo, location, formatFilter]);

  const { data, isLoading, error } = useSWR<{ items: ActivityItem[] }>(
    `/api/activity${queryString}`,
    fetcher,
    { keepPreviousData: true },
  );

  if (error) toast.error("Failed to load activity");

  const items = data?.items ?? [];
  const hasFilters = q || dateFrom || dateTo || location || formatFilter;

  return (
    <div className="max-w-[640px] mx-auto px-4 pt-5 pb-24 md:pb-6">
      <div className="mb-5 flex items-center justify-between gap-2">
        <div>
          <p
            style={{
              fontFamily: "var(--font-pixel-display)",
              fontSize: "11px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--muted-foreground)",
            }}
          >
            activity
          </p>
          <h1 className="text-2xl font-semibold mt-0.5" style={{ fontFamily: "var(--font-script)" }}>
            full history
          </h1>
        </div>
        <Link
          href="/"
          className="text-xs font-bold px-2.5 py-1 border-2 border-[#1F2024] bg-card"
          style={{ borderRadius: "8px", boxShadow: "2px 2px 0 #1F2024" }}
        >
          ← Dashboard
        </Link>
      </div>

      {/* Filters */}
      <div
        className="mb-5 rounded-[10px] border-2 border-[#1F2024] bg-card p-3 space-y-2"
        style={{ boxShadow: "4px 4px 0 #1F2024" }}
      >
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Individual
          </label>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              From
            </label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              To
            </label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Location
          </label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Search by place name"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Format
          </label>
          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            className="h-8 w-full min-w-0 rounded-lg border-2 border-[var(--shadow-hard)] bg-background px-2 py-1 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {FORMAT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {hasFilters && (
          <button
            onClick={() => {
              setQ("");
              setDateFrom("");
              setDateTo("");
              setLocation("");
              setFormatFilter("");
            }}
            className="text-xs font-bold underline underline-offset-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Scrollable list */}
      <div
        className="rounded-[10px] border-2 border-[#1F2024] bg-card overflow-y-auto"
        style={{ boxShadow: "4px 4px 0 #1F2024", maxHeight: "60vh" }}
      >
        {isLoading && items.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            {hasFilters ? "No activity matches these filters." : "No activity yet."}
          </div>
        ) : (
          <ul className="divide-y divide-[#DEDEDE]">
            {items.map((item) => {
              const name = [item.contact.firstName, item.contact.lastName]
                .filter(Boolean)
                .join(" ");
              const date = item.completedAt ?? item.scheduledAt;
              const typeLabel = activityTypeLabel(item);
              const detail =
                item.hangout?.type === "in-person" && item.hangout.locationName
                  ? item.hangout.locationName
                  : item.hangout?.type === "digital" && item.hangout.platform
                    ? HANGOUT_PLATFORM_LABELS[item.hangout.platform] ?? item.hangout.platform
                    : null;

              return (
                <li key={item.id}>
                  <button
                    className="w-full text-left px-3 py-2.5 flex items-center gap-3 text-sm hover:bg-accent/10 transition-colors"
                    onClick={() => setActive(item)}
                  >
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${item.status === "completed" ? "bg-[var(--splash-mint)]" : "bg-[var(--muted)]"}`}
                      style={{ border: "1.5px solid #1F2024" }}
                    />
                    <span className="flex-1 min-w-0">
                      <span className="font-semibold truncate block">{name}</span>
                      <span className="text-xs text-muted-foreground">
                        {typeLabel}
                        {detail ? ` · ${detail}` : ""}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(date), "MMM d, yyyy")}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {items.length >= 200 && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          Showing the 200 most recent matches. Narrow filters to see older activity.
        </p>
      )}

      {active && <ActivityDetailModal item={active} onClose={() => setActive(null)} />}
    </div>
  );
}
