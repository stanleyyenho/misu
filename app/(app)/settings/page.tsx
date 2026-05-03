"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { NotificationBell } from "@/components/NotificationBell";
import { createClient } from "@/lib/supabase/client";

interface CalendarShare {
  id: string;
  token: string;
  label: string;
  createdAt: string;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

function SectionHeader({ label }: { label: string }) {
  return (
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
      {label}
    </p>
  );
}

export default function SettingsPage() {
  const supabase = createClient();
  const [shares, setShares] = useState<CalendarShare[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);

  // Profile state
  const [profile, setProfile] = useState<UserProfile>({ firstName: "", lastName: "", email: "", phone: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  // Style calibration state (stored locally for now — future: persist to user profile)
  const [sampleTexts, setSampleTexts] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("misu_sample_texts") ?? ""
      : ""
  );
  const [savingSamples, setSavingSamples] = useState(false);

  useEffect(() => {
    loadShares();
    loadProfile();
    if (typeof window !== "undefined") {
      if ("Notification" in window) setNotifGranted(Notification.permission === "granted");
      setSampleTexts(localStorage.getItem("misu_sample_texts") ?? "");
    }
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    const res = await fetch("/api/profile");
    if (res.ok) {
      const data = await res.json();
      setProfile({
        firstName: data?.firstName ?? "",
        lastName: data?.lastName ?? "",
        email: data?.email || user?.email || "",
        phone: data?.phone || user?.phone || "",
      });
    }
  }

  async function saveProfile() {
    if (!profile.firstName.trim()) { toast.error("First name is required"); return; }
    setSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to save profile");
      }
      toast.success("Profile saved!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  }

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

  function saveSampleTexts() {
    setSavingSamples(true);
    localStorage.setItem("misu_sample_texts", sampleTexts);
    setTimeout(() => {
      setSavingSamples(false);
      toast.success("Voice samples saved!");
    }, 300);
  }

  return (
    <div className="max-w-[480px] mx-auto px-4 pt-5 pb-24 md:pb-6">
      <p
        style={{
          fontFamily: "var(--font-pixel-display)",
          fontSize: "11px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--muted-foreground)",
        }}
      >
        preferences
      </p>
      <h1 className="text-xl font-semibold mt-0.5 mb-6" style={{ fontFamily: "var(--font-script)" }}>
        settings
      </h1>

      {/* Profile */}
      <section className="mb-6">
        <SectionHeader label="your profile" />
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="firstName" className="text-sm font-semibold">First name *</Label>
              <Input
                id="firstName"
                value={profile.firstName}
                onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                placeholder="Alex"
                className="mt-1.5"
                style={{ borderRadius: "8px" }}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="lastName" className="text-sm font-semibold">Last name</Label>
              <Input
                id="lastName"
                value={profile.lastName}
                onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                placeholder="Johnson"
                className="mt-1.5"
                style={{ borderRadius: "8px" }}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="profileEmail" className="text-sm font-semibold">Email</Label>
            <Input
              id="profileEmail"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              placeholder="you@example.com"
              className="mt-1.5"
              style={{ borderRadius: "8px" }}
            />
          </div>
          <div>
            <Label htmlFor="profilePhone" className="text-sm font-semibold">Phone number</Label>
            <Input
              id="profilePhone"
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+1 (555) 000-0000"
              className="mt-1.5"
              style={{ borderRadius: "8px" }}
            />
          </div>
        </div>
        <Button
          size="sm"
          onClick={saveProfile}
          disabled={savingProfile}
          className="mt-3"
          style={{ borderRadius: "8px" }}
        >
          {savingProfile ? "Saving..." : "Save profile"}
        </Button>
      </section>

      <Separator className="mb-6" />

      {/* Voice calibration */}
      <section className="mb-6">
        <SectionHeader label="message voice" />
        <p className="text-sm text-muted-foreground mb-3">
          Paste a few real texts you&apos;ve sent to friends. misu uses these as examples to match your writing style when generating messages.
        </p>
        <Textarea
          value={sampleTexts}
          onChange={(e) => setSampleTexts(e.target.value)}
          placeholder={`e.g.\n"yo what are you up to this weekend"\n"dude we literally need to hang, it's been forever"\n"just saw something that reminded me of you lol"`}
          rows={6}
          style={{ borderRadius: "8px" }}
        />
        <Button
          size="sm"
          onClick={saveSampleTexts}
          disabled={savingSamples}
          className="mt-2"
          style={{ borderRadius: "8px" }}
        >
          {savingSamples ? "Saving..." : "Save samples"}
        </Button>
        <p className="text-xs text-muted-foreground mt-1.5">
          Stored locally on your device — never sent to our servers
        </p>
      </section>

      <Separator className="mb-6" />

      {/* Messaging platforms */}
      <section className="mb-6">
        <SectionHeader label="messaging platforms" />
        <div
          className="rounded-[10px] border-2 border-[#1F2024] p-4 bg-secondary/30"
          style={{ boxShadow: "3px 3px 0 #1F2024" }}
        >
          <div className="flex items-start gap-3">
            <div
              className="mt-0.5 h-5 w-5 rounded border-2 border-[#1F2024] bg-[var(--splash-mint)] flex items-center justify-center shrink-0"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1F2024" strokeWidth={3} strokeLinecap="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold">Deep link delivery active</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                iMessage, WhatsApp, Instagram, and Messenger are delivered via deep link — misu opens the app with your message pre-loaded.
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#DEDEDE]">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">SMS auto-send</p>
            <p className="text-sm text-muted-foreground">
              SMS messages can be sent automatically via Twilio. Set{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">TWILIO_*</code>{" "}
              env vars to enable.
            </p>
          </div>
        </div>
      </section>

      <Separator className="mb-6" />

      {/* Notifications */}
      <section className="mb-6">
        <SectionHeader label="push notifications" />
        <p className="text-sm text-muted-foreground mb-3">
          Get notified when it&apos;s time to send a check-in.{" "}
          <span className="font-semibold text-foreground">
            On iPhone, add misu to your home screen first.
          </span>
        </p>

        {notifGranted ? (
          <p className="text-sm font-medium flex items-center gap-1.5" style={{ color: "var(--splash-mint)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Notifications enabled
          </p>
        ) : (
          <NotificationBell />
        )}

        <div
          className="mt-4 rounded-[8px] border-2 border-[#DEDEDE] p-3 text-sm space-y-1"
        >
          <p className="font-bold text-xs uppercase tracking-wide text-muted-foreground">How to add to iPhone home screen</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-sm">
            <li>Open this page in Safari</li>
            <li>Tap the Share button (box with arrow)</li>
            <li>Tap &ldquo;Add to Home Screen&rdquo;</li>
            <li>Open the app from home screen, then enable notifications</li>
          </ol>
          <p className="text-xs text-muted-foreground pt-1">
            Requires iOS 16.4+ and Safari.
          </p>
        </div>
      </section>

      <Separator className="mb-6" />

      {/* Calendar sharing */}
      <section>
        <SectionHeader label="calendar sharing" />
        <p className="text-sm text-muted-foreground mb-4">
          Subscribe to your check-in schedule in Google Calendar, Apple Calendar, or Outlook via iCal URL.
        </p>

        <div className="flex gap-2 mb-5">
          <Input
            placeholder='Label, e.g. "Google Calendar"'
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createShare()}
            style={{ borderRadius: "8px" }}
          />
          <Button
            onClick={createShare}
            disabled={creating}
            className="shrink-0"
            style={{ borderRadius: "8px" }}
          >
            Create
          </Button>
        </div>

        {shares.length === 0 ? (
          <p className="text-sm text-muted-foreground">No links yet.</p>
        ) : (
          <ul className="space-y-3">
            {shares.map((s) => (
              <li
                key={s.id}
                className="rounded-[8px] border-2 border-[#1F2024] p-3"
                style={{ boxShadow: "2px 2px 0 #1F2024" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-sm">{s.label}</p>
                  <button
                    onClick={() => deleteShare(s.id)}
                    className="text-xs font-semibold"
                    style={{ color: "var(--destructive)" }}
                  >
                    Remove
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1.5 rounded flex-1 truncate font-mono">
                    {typeof window !== "undefined" ? getIcalUrl(s.token) : ""}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(getIcalUrl(s.token));
                      toast.success("Copied!");
                    }}
                    className="shrink-0"
                    style={{ borderRadius: "8px" }}
                  >
                    Copy
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Separator className="mb-6 mt-6" />

      {/* Account */}
      <section className="mb-6">
        <SectionHeader label="account" />
        <Button
          variant="outline"
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/login";
          }}
          style={{ borderRadius: "8px" }}
        >
          Sign out
        </Button>
      </section>
    </div>
  );
}
