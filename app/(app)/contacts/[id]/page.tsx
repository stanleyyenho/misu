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
import { HangoutPlanningModal } from "@/components/HangoutPlanningModal";
import { HangoutInstancesEditor } from "@/components/HangoutInstancesEditor";
import { getAvatarColor } from "@/lib/avatar-color";

interface CheckIn {
  id: string;
  scheduledAt: string;
  completedAt: string | null;
  format: string | null;
  notes: string | null;
  status: string;
}

interface Hangout {
  id: string;
  type: string;
  status: string;
  date: string;
  locationName: string | null;
  locationAddr: string | null;
  platform: string | null;
  meetingLink: string | null;
  noteToFriend: string | null;
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
    frequencyJitterDays: number;
    tone: string;
    checkInType: string;
    approveBeforeSend: boolean;
    nextCheckIn: string;
    isActive: boolean;
    hangoutType: string;
    cadenceMode: string;
    leadTimeDays: number;
    defaultHangout: string | null;
  } | null;
  checkIns: CheckIn[];
  hangouts: Hangout[];
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

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  invited: "Invited",
  confirmed: "Confirmed",
  declined: "Declined",
  counter: "Counter-proposed",
  completed: "Completed",
  skipped: "Skipped",
};

const HANGOUT_PLATFORM_LABELS: Record<string, string> = {
  facetime: "FaceTime",
  zoom: "Zoom",
  "google-meet": "Google Meet",
  teams: "Teams",
  other: "Video call",
};

function HangoutCard({ hangout, onUpdated }: { hangout: Hangout; onUpdated: () => void }) {
  const [sending, setSending] = useState(false);

  async function handleSendInvite() {
    setSending(true);
    try {
      const res = await fetch(`/api/hangouts/${hangout.id}/send-invite`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to send invite"); return; }
      if (data.warnings?.length) toast.warning(data.warnings.join("; "));
      else toast.success("Invite sent!");
      onUpdated();
    } catch {
      toast.error("Failed to send invite");
    } finally {
      setSending(false);
    }
  }

  return (
    <li
      className="rounded-[10px] border-2 border-[#1F2024] p-3 text-sm"
      style={{ boxShadow: "2px 2px 0 #1F2024" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold">
            {format(new Date(hangout.date), "MMM d, yyyy 'at' h:mm a")}
          </p>
          {hangout.type === "in-person" && hangout.locationName && (
            <p className="text-muted-foreground mt-0.5 truncate">
              {hangout.locationName}{hangout.locationAddr ? ` · ${hangout.locationAddr}` : ""}
            </p>
          )}
          {hangout.type === "digital" && hangout.platform && (
            <p className="text-muted-foreground mt-0.5">
              {HANGOUT_PLATFORM_LABELS[hangout.platform] ?? hangout.platform}
              {hangout.meetingLink ? " · link provided" : ""}
            </p>
          )}
          {hangout.status === "counter" && hangout.noteToFriend && (
            <p className="mt-1 text-xs font-semibold text-amber-600">{hangout.noteToFriend}</p>
          )}
        </div>
        <Badge
          variant="outline"
          className="shrink-0 text-[11px] font-bold border border-[#DEDEDE] capitalize"
          style={{ borderRadius: "8px" }}
        >
          {STATUS_LABELS[hangout.status] ?? hangout.status}
        </Badge>
      </div>
      {hangout.status === "draft" && (
        <Button
          size="sm"
          onClick={handleSendInvite}
          disabled={sending}
          className="mt-3 w-full"
          style={{ borderRadius: "8px" }}
        >
          {sending ? "Sending..." : "Send invite"}
        </Button>
      )}
    </li>
  );
}

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [hangoutModalOpen, setHangoutModalOpen] = useState(false);

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
            initialFrequencyJitterDays={contact.schedule?.isActive ? (contact.schedule.frequencyJitterDays ?? 0) : 0}
            initialTone={contact.schedule?.tone ?? "casual"}
            initialCheckInType={contact.schedule?.checkInType ?? "generic"}
            initialApproveBeforeSend={contact.schedule?.approveBeforeSend ?? true}
            initialHangoutType={contact.schedule?.hangoutType ?? "in-person"}
            initialCadenceMode={contact.schedule?.cadenceMode ?? "prompt"}
            initialLeadTimeDays={contact.schedule?.leadTimeDays ?? 7}
            initialDefaultHangout={contact.schedule?.defaultHangout ? JSON.parse(contact.schedule.defaultHangout) : null}
            onSaved={load}
          />
          {contact.schedule?.isActive && contact.schedule.cadenceMode === "planned" && (
            <>
              <div className="my-5 h-px bg-border" />
              <HangoutInstancesEditor
                contactId={id}
                hangoutType={contact.schedule.hangoutType}
              />
            </>
          )}
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

        {/* Hangouts */}
        <section className="mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold">Hangouts</h2>
            <Button
              size="sm"
              onClick={() => setHangoutModalOpen(true)}
              style={{ borderRadius: "8px" }}
            >
              + Plan hangout
            </Button>
          </div>

          {contact.hangouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hangouts planned yet.</p>
          ) : (
            <ul className="space-y-3">
              {contact.hangouts.map((h) => (
                <HangoutCard key={h.id} hangout={h} onUpdated={load} />
              ))}
            </ul>
          )}
        </section>

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

      <HangoutPlanningModal
        open={hangoutModalOpen}
        onOpenChange={setHangoutModalOpen}
        contactId={id}
        contactName={name}
        onCreated={load}
      />
    </div>
  );
}
