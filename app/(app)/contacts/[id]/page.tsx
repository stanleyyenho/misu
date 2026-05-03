"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScheduleForm } from "@/components/ScheduleForm";
import { getAvatarColor } from "@/lib/avatar-color";

interface CheckIn {
  id: string;
  scheduledAt: string;
  completedAt: string | null;
  format: string | null;
  notes: string | null;
  status: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  messagingPlatform: string | null;
  notes: string | null;
  schedule: {
    frequencyDays: number;
    tone: string;
    checkInType: string;
    approveBeforeSend: boolean;
    nextCheckIn: string;
    isActive: boolean;
  } | null;
  checkIns: CheckIn[];
}

const PLATFORM_LABELS: Record<string, string> = {
  sms: "SMS",
  imessage: "iMessage",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  messenger: "Messenger",
};

const TONE_LABELS: Record<string, string> = {
  casual: "Casual",
  warm: "Warm",
  formal: "Formal",
  playful: "Playful",
};

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  async function load() {
    const res = await fetch(`/api/contacts/${id}`);
    if (!res.ok) { router.push("/contacts"); return; }
    const data = await res.json();
    setContact(data);
    setNotes(data.notes ?? "");
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveNotes() {
    setSavingNotes(true);
    try {
      await fetch(`/api/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      toast.success("Notes saved");
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete ${contact?.firstName}? This cannot be undone.`)) return;
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    toast.success("Contact deleted");
    router.push("/contacts");
  }

  if (!contact) {
    return <div className="p-4 text-muted-foreground animate-pulse font-semibold">Loading...</div>;
  }

  const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
  const color = getAvatarColor(name);
  const pastCheckIns = contact.checkIns.filter((c) => c.status !== "pending").slice(-5).reverse();

  return (
    <div className="max-w-[480px] mx-auto">
      {/* Mobile top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-[#1F2024] md:hidden">
        <button onClick={() => router.back()} className="text-muted-foreground p-1 -ml-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="font-bold truncate">{name}</span>
      </div>

      <div className="p-4 md:p-6">
        <div className="hidden md:flex items-center gap-2 mb-6">
          <Link href="/contacts" className="text-sm text-muted-foreground hover:text-foreground font-semibold">
            ← Contacts
          </Link>
        </div>

        {/* Contact header */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="h-16 w-16 rounded-full border-2 border-[#1F2024] flex items-center justify-center overflow-hidden shrink-0 crosshatch-light"
            style={{ backgroundColor: contact.avatarUrl ? undefined : color.bg, boxShadow: "3px 3px 0 #1F2024" }}
          >
            {contact.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={contact.avatarUrl} alt={name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-bold" style={{ color: color.fg }}>
                {contact.firstName[0]}{contact.lastName?.[0] ?? ""}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold">{name}</h1>
            {contact.phone && <p className="text-sm text-muted-foreground">{contact.phone}</p>}
            {contact.email && <p className="text-sm text-muted-foreground">{contact.email}</p>}
            {contact.messagingPlatform && (
              <span
                className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 border-2 border-[#1F2024]"
                style={{ borderRadius: "8px", backgroundColor: "var(--accent)", boxShadow: "1px 1px 0 #1F2024" }}
              >
                {PLATFORM_LABELS[contact.messagingPlatform] ?? contact.messagingPlatform}
              </span>
            )}
          </div>
        </div>

        {/* Active cadence summary */}
        {contact.schedule?.isActive && (
          <div
            className="mb-6 rounded-[10px] border-2 border-[#1F2024] bg-secondary/50 p-4"
            style={{ boxShadow: "3px 3px 0 #1F2024" }}
          >
            <p
              style={{
                fontFamily: "var(--font-pixel-display)",
                fontSize: "10px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--muted-foreground)",
              }}
            >
              active cadence
            </p>
            <p className="text-sm font-bold mt-1">
              Every {contact.schedule.frequencyDays} days
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Next check-in:{" "}
              <span className="font-bold text-foreground">
                {format(new Date(contact.schedule.nextCheckIn), "MMM d, yyyy")}
              </span>
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Badge
                className="text-[11px] font-bold border-2 border-[#1F2024]"
                style={{ borderRadius: "8px", backgroundColor: "var(--accent)", color: "#1F2024", boxShadow: "1px 1px 0 #1F2024" }}
              >
                {TONE_LABELS[contact.schedule.tone] ?? contact.schedule.tone}
              </Badge>
              <Badge
                variant="secondary"
                className="text-[11px] font-bold border border-[#DEDEDE]"
                style={{ borderRadius: "8px" }}
              >
                {contact.schedule.approveBeforeSend ? "review before send" : "auto-send"}
              </Badge>
            </div>
          </div>
        )}

        <Separator className="my-5" />

        {/* Cadence settings */}
        <section className="mb-5">
          <h2 className="text-base font-bold mb-4">
            {contact.schedule?.isActive ? "Edit cadence" : "Set a cadence"}
          </h2>
          <ScheduleForm
            contactId={id}
            contactPhone={contact.phone}
            contactPlatform={contact.messagingPlatform}
            initialFrequencyDays={contact.schedule?.isActive ? contact.schedule.frequencyDays : undefined}
            initialTone={contact.schedule?.tone ?? "casual"}
            initialCheckInType={contact.schedule?.checkInType ?? "generic"}
            initialApproveBeforeSend={contact.schedule?.approveBeforeSend ?? true}
            onSaved={load}
          />
        </section>

        <Separator className="my-5" />

        {/* Context notes */}
        <section className="mb-5">
          <h2 className="text-base font-bold mb-1">Context notes</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Notes fed to the AI when generating messages — e.g. &ldquo;just had a baby&rdquo;, &ldquo;loves hiking&rdquo;
          </p>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Just moved to Austin, big Taylor Swift fan, we used to play ultimate frisbee together"
            rows={3}
            style={{ borderRadius: "8px" }}
          />
          <Button
            size="sm"
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="mt-2"
            style={{ borderRadius: "8px" }}
          >
            {savingNotes ? "Saving..." : "Save notes"}
          </Button>
        </section>

        {/* Past check-ins */}
        {pastCheckIns.length > 0 && (
          <>
            <Separator className="my-5" />
            <section className="mb-5">
              <h2 className="text-base font-bold mb-4">recent check-ins</h2>
              <ul className="space-y-3">
                {pastCheckIns.map((ci) => (
                  <li key={ci.id} className="flex items-start gap-3 text-sm">
                    <Badge
                      variant={ci.status === "completed" ? "default" : "outline"}
                      className="shrink-0 mt-0.5"
                      style={{ borderRadius: "8px" }}
                    >
                      {ci.status}
                    </Badge>
                    <div>
                      <p className="font-semibold">{format(new Date(ci.scheduledAt), "MMM d, yyyy")}</p>
                      {ci.notes && <p className="text-muted-foreground text-xs italic mt-0.5">{ci.notes}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        <Separator className="my-5" />
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          style={{ borderRadius: "8px" }}
        >
          Delete contact
        </Button>
      </div>
    </div>
  );
}
