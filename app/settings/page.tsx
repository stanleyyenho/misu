"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { NotificationBell } from "@/components/NotificationBell";

interface CalendarShare {
  id: string;
  token: string;
  label: string;
  createdAt: string;
}

export default function SettingsPage() {
  const [shares, setShares] = useState<CalendarShare[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);

  useEffect(() => {
    loadShares();
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifGranted(Notification.permission === "granted");
    }
  }, []);

  async function loadShares() {
    const res = await fetch("/api/calendar/share");
    setShares(await res.json());
  }

  async function createShare() {
    if (!newLabel.trim()) { toast.error("Please enter a label"); return; }
    setCreating(true);
    try {
      await fetch("/api/calendar/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel.trim() }),
      });
      setNewLabel("");
      await loadShares();
      toast.success("Calendar link created!");
    } finally {
      setCreating(false);
    }
  }

  async function deleteShare(id: string) {
    await fetch("/api/calendar/share", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await loadShares();
    toast.info("Calendar link deleted");
  }

  function getIcalUrl(token: string) {
    return `${window.location.origin}/api/calendar/${token}`;
  }

  function copyUrl(token: string) {
    navigator.clipboard.writeText(getIcalUrl(token));
    toast.success("Copied!");
  }

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold mb-1">Settings</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Notifications and calendar sharing
      </p>

      {/* Notifications */}
      <section className="mb-6">
        <h2 className="text-base font-semibold mb-1">Push notifications</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Get reminded at 8am on the day of each scheduled check-in.
          {" "}
          <span className="font-medium text-foreground">
            On iPhone, add Misu to your home screen first.
          </span>
        </p>

        {notifGranted ? (
          <p className="text-sm text-green-600 font-medium flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Notifications enabled
          </p>
        ) : (
          <NotificationBell />
        )}

        <div className="mt-4 rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
          <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground">How to add to iPhone home screen</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-sm">
            <li>Open this page in Safari</li>
            <li>Tap the Share button (box with arrow)</li>
            <li>Tap &ldquo;Add to Home Screen&rdquo;</li>
            <li>Open the app from home screen, then tap &ldquo;Enable notifications&rdquo;</li>
          </ol>
          <p className="text-xs text-muted-foreground pt-1">
            Requires iOS 16.4+ and Safari. Push notifications only work when added to the home screen.
          </p>
        </div>
      </section>

      <Separator className="mb-6" />

      {/* Calendar sharing */}
      <section>
        <h2 className="text-base font-semibold mb-1">Shareable calendar</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Generates an iCal URL you can subscribe to in Google Calendar, Apple Calendar, or Outlook.
        </p>

        <div className="flex gap-2 mb-5">
          <Input
            placeholder='Label, e.g. "Google Calendar"'
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createShare()}
          />
          <Button onClick={createShare} disabled={creating} className="shrink-0">
            Create
          </Button>
        </div>

        {shares.length === 0 ? (
          <p className="text-sm text-muted-foreground">No links yet.</p>
        ) : (
          <ul className="space-y-3">
            {shares.map((s) => (
              <li key={s.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">{s.label}</p>
                  <button
                    onClick={() => deleteShare(s.id)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1.5 rounded flex-1 truncate">
                    {typeof window !== "undefined" ? getIcalUrl(s.token) : ""}
                  </code>
                  <Button size="sm" variant="outline" onClick={() => copyUrl(s.token)} className="shrink-0">
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Google Calendar: Other calendars (+) → From URL → paste above
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
