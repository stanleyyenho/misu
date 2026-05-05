"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationSearch, type LocationResult } from "@/components/LocationSearch";
import { getAvatarColor } from "@/lib/avatar-color";

// ─── shared types (exported so dashboard + calendar can use them) ────────────

export interface CheckInDetail {
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

export interface HangoutDetail {
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
  contact: {
    id: string;
    firstName: string;
    lastName: string | null;
    phone: string | null;
  };
}

export type CalendarEventModalProps = {
  onClose: () => void;
  onUpdate: () => void;
} & (
  | { kind: "checkin"; data: CheckInDetail; onSend?: (ci: CheckInDetail) => void }
  | { kind: "hangout"; data: HangoutDetail }
);

// ─── constants ───────────────────────────────────────────────────────────────

const DIGITAL_PLATFORMS = [
  { id: "facetime", label: "FaceTime" },
  { id: "zoom", label: "Zoom" },
  { id: "google-meet", label: "Google Meet" },
  { id: "teams", label: "Teams" },
  { id: "other", label: "Other" },
];

const PLATFORM_LABELS: Record<string, string> = {
  facetime: "FaceTime", zoom: "Zoom", "google-meet": "Google Meet",
  teams: "Teams", other: "Video call",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft", invited: "Invited", confirmed: "Confirmed",
  declined: "Declined", counter: "Counter-proposed",
  completed: "Completed", skipped: "Skipped",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "var(--secondary)",
  invited: "var(--splash-yellow)",
  confirmed: "var(--splash-mint)",
  declined: "var(--destructive)",
  counter: "var(--splash-orange)",
  completed: "var(--splash-mint)",
  skipped: "var(--muted)",
};

const TONE_LABELS: Record<string, string> = {
  casual: "Casual", warm: "Warm", formal: "Formal", playful: "Playful",
};

// ─── shared pill button ───────────────────────────────────────────────────────

function PillButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm font-bold px-3 py-1.5 border-2 border-[#1F2024] transition-all"
      style={{
        borderRadius: "8px",
        backgroundColor: active ? "#1F2024" : "transparent",
        color: active ? "#FFFFFF" : "#1F2024",
        boxShadow: active ? "2px 2px 0 #1F2024" : "none",
      }}
    >
      {children}
    </button>
  );
}

// ─── hangout type label ───────────────────────────────────────────────────────

function hangoutTypeLabel(data: HangoutDetail) {
  if (data.checkInId) return "Recurring hangout";
  return "One-time hangout";
}

// ─── check-in detail view ─────────────────────────────────────────────────────

function CheckInDetailView({
  data,
  onSend,
  onSkip,
  onReschedule,
}: {
  data: CheckInDetail;
  onSend?: () => void;
  onSkip: () => void;
  onReschedule: () => void;
}) {
  const { schedule } = data.contact;
  const isHangoutMode = schedule && schedule.cadenceMode !== "prompt";

  return (
    <div className="space-y-4">
      {/* Type + cadence row */}
      <div className="rounded-[10px] border-2 border-[#1F2024] p-4 space-y-2" style={{ boxShadow: "2px 2px 0 #1F2024" }}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base">{isHangoutMode ? "🎊" : "💬"}</span>
          <span className="text-sm font-bold">
            {isHangoutMode ? "Recurring hangout reminder" : "Recurring message check-in"}
          </span>
        </div>
        {schedule && (
          <p className="text-sm text-muted-foreground">
            Every <strong>{schedule.frequencyDays}</strong> days
            {schedule.tone && (
              <> · <strong>{TONE_LABELS[schedule.tone] ?? schedule.tone}</strong> tone</>
            )}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Scheduled for <strong>{format(new Date(data.scheduledAt), "EEEE, MMMM d, yyyy")}</strong>
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row">
        {onSend && (
          <Button onClick={onSend} className="flex-1" style={{ borderRadius: "8px" }}>
            {isHangoutMode ? "Send invite →" : "Send message →"}
          </Button>
        )}
        <Button variant="outline" onClick={onReschedule} className="flex-1" style={{ borderRadius: "8px" }}>
          Reschedule
        </Button>
        <Button variant="ghost" onClick={onSkip} className="flex-1" style={{ borderRadius: "8px" }}>
          Skip
        </Button>
      </div>
    </div>
  );
}

// ─── hangout detail view ──────────────────────────────────────────────────────

function HangoutDetailView({
  data,
  onEdit,
  onSendInvite,
  onComplete,
  onSkip,
  sending,
}: {
  data: HangoutDetail;
  onEdit: () => void;
  onSendInvite: () => void;
  onComplete: () => void;
  onSkip: () => void;
  sending: boolean;
}) {
  const isPast = new Date(data.date) < new Date();

  return (
    <div className="space-y-4">
      {/* Detail card */}
      <div className="rounded-[10px] border-2 border-[#1F2024] p-4 space-y-2" style={{ boxShadow: "2px 2px 0 #1F2024" }}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base">{data.checkInId ? "🎊" : "🎉"}</span>
          <span className="text-sm font-bold">{hangoutTypeLabel(data)}</span>
          <span
            className="text-[11px] font-bold px-2 py-0.5 border border-[#1F2024]"
            style={{ borderRadius: "8px", backgroundColor: STATUS_COLORS[data.status] ?? "var(--secondary)" }}
          >
            {STATUS_LABELS[data.status] ?? data.status}
          </span>
        </div>

        <p className="text-sm font-semibold">
          {format(new Date(data.date), "EEEE, MMMM d, yyyy 'at' h:mm a")}
        </p>

        {data.type === "in-person" && data.locationName && (
          <p className="text-sm text-muted-foreground">
            📍 {data.locationName}{data.locationAddr ? ` · ${data.locationAddr}` : ""}
          </p>
        )}
        {data.type === "digital" && data.platform && (
          <p className="text-sm text-muted-foreground">
            💻 {PLATFORM_LABELS[data.platform] ?? data.platform}
            {data.meetingLink && (
              <> · <a href={data.meetingLink} target="_blank" rel="noopener noreferrer" className="underline">join link</a></>
            )}
          </p>
        )}
        {data.noteToFriend && (
          <p className="text-sm italic text-muted-foreground">
            &ldquo;{data.noteToFriend}&rdquo;
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row flex-wrap">
        {data.status === "draft" && (
          <Button onClick={onSendInvite} disabled={sending} className="flex-1" style={{ borderRadius: "8px" }}>
            {sending ? "Sending…" : "Send invite"}
          </Button>
        )}
        {!isPast && (
          <Button variant="outline" onClick={onEdit} className="flex-1" style={{ borderRadius: "8px" }}>
            Edit details
          </Button>
        )}
        {isPast && data.status !== "completed" && data.status !== "skipped" && (
          <Button onClick={onComplete} className="flex-1" style={{ borderRadius: "8px" }}>
            Mark as done
          </Button>
        )}
        {data.status !== "skipped" && data.status !== "completed" && (
          <Button variant="ghost" onClick={onSkip} className="flex-1" style={{ borderRadius: "8px" }}>
            Skip
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── hangout edit view ────────────────────────────────────────────────────────

function HangoutEditView({
  data,
  onBack,
  onUpdated,
}: {
  data: HangoutDetail;
  onBack: () => void;
  onUpdated: () => void;
}) {
  const d = new Date(data.date);
  const [date, setDate] = useState(format(d, "yyyy-MM-dd"));
  const [time, setTime] = useState(format(d, "HH:mm"));
  const [locationName, setLocationName] = useState(data.locationName ?? "");
  const [locationAddr, setLocationAddr] = useState(data.locationAddr ?? "");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [platform, setPlatform] = useState(data.platform ?? "");
  const [meetingLink, setMeetingLink] = useState(data.meetingLink ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave(notify: boolean) {
    if (!date || !time) { toast.error("Please set a date and time"); return; }
    const datetime = new Date(`${date}T${time}:00`);
    if (isNaN(datetime.getTime())) { toast.error("Invalid date or time"); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/hangouts/${data.id}/send-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notify,
          date: datetime.toISOString(),
          locationName: data.type === "in-person" ? locationName || null : null,
          locationAddr: data.type === "in-person" ? locationAddr || null : null,
          locationLat: data.type === "in-person" ? locationLat : null,
          locationLng: data.type === "in-person" ? locationLng : null,
          platform: data.type === "digital" ? platform || null : null,
          meetingLink: data.type === "digital" ? meetingLink || null : null,
        }),
      });
      const body = await res.json();
      if (!res.ok) { toast.error(body.error ?? "Failed to update"); return; }
      if (body.warning) toast.warning(body.warning);
      else toast.success(notify ? `Updated and notified ${data.contact.firstName}` : "Hangout updated");
      onUpdated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Date + time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wide">Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ borderRadius: "8px" }} />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wide">Time</Label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ borderRadius: "8px" }} />
        </div>
      </div>

      {/* Location or platform */}
      {data.type === "in-person" && (
        <div>
          <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wide">Venue</Label>
          <LocationSearch
            value={locationName}
            onChange={(val) => { setLocationName(val); setLocationLat(null); setLocationLng(null); setLocationAddr(""); }}
            onSelect={(r: LocationResult) => { setLocationName(r.name); setLocationAddr(r.address); setLocationLat(r.lat); setLocationLng(r.lng); }}
          />
          {locationAddr && <p className="mt-1 text-xs text-muted-foreground truncate">{locationAddr}</p>}
        </div>
      )}
      {data.type === "digital" && (
        <>
          <div>
            <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wide">Platform</Label>
            <div className="flex flex-wrap gap-2">
              {DIGITAL_PLATFORMS.map((p) => (
                <PillButton key={p.id} active={platform === p.id} onClick={() => setPlatform(p.id)}>
                  {p.label}
                </PillButton>
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wide">
              Meeting link <span className="font-normal normal-case text-muted-foreground">(optional)</span>
            </Label>
            <Input type="url" placeholder="https://zoom.us/j/…" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} style={{ borderRadius: "8px" }} />
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {data.contact.phone && data.status !== "draft" && (
          <Button onClick={() => handleSave(true)} disabled={saving} style={{ borderRadius: "8px" }}>
            {saving ? "Saving…" : `Save & notify ${data.contact.firstName} via SMS`}
          </Button>
        )}
        <Button variant="outline" onClick={() => handleSave(false)} disabled={saving} style={{ borderRadius: "8px" }}>
          Save without notifying
        </Button>
        <Button variant="ghost" onClick={onBack} disabled={saving} style={{ borderRadius: "8px" }}>
          ← Back
        </Button>
      </div>
    </div>
  );
}

// ─── reschedule view (check-ins) ──────────────────────────────────────────────

function RescheduleView({
  checkInId,
  onBack,
  onUpdated,
}: {
  checkInId: string;
  onBack: () => void;
  onUpdated: () => void;
}) {
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleReschedule() {
    if (!date) { toast.error("Pick a date"); return; }
    setSaving(true);
    try {
      await fetch(`/api/checkins/${checkInId}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: new Date(date).toISOString() }),
      });
      toast.success("Rescheduled!");
      onUpdated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wide">New date</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={format(new Date(), "yyyy-MM-dd")} style={{ borderRadius: "8px" }} />
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={onBack} style={{ borderRadius: "8px" }}>← Back</Button>
        <Button onClick={handleReschedule} disabled={!date || saving} style={{ borderRadius: "8px" }}>
          {saving ? "Saving…" : "Reschedule"}
        </Button>
      </div>
    </div>
  );
}

// ─── main modal ───────────────────────────────────────────────────────────────

export function CalendarEventModal(props: CalendarEventModalProps) {
  const { onClose, onUpdate } = props;
  const [view, setView] = useState<"detail" | "edit" | "reschedule">("detail");
  const [actionLoading, setActionLoading] = useState(false);

  const name =
    props.kind === "checkin"
      ? [props.data.contact.firstName, props.data.contact.lastName].filter(Boolean).join(" ")
      : [props.data.contact.firstName, props.data.contact.lastName].filter(Boolean).join(" ");

  const avatarColor = getAvatarColor(name);

  async function skipCheckIn() {
    if (props.kind !== "checkin") return;
    setActionLoading(true);
    try {
      await fetch(`/api/checkins/${props.data.id}/skip`, { method: "POST" });
      toast.info(`Skipped check-in with ${name}`);
      onUpdate();
    } finally {
      setActionLoading(false);
    }
  }

  async function sendHangoutInvite() {
    if (props.kind !== "hangout") return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/hangouts/${props.data.id}/send-invite`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to send invite"); return; }
      if (data.warnings?.length) toast.warning(data.warnings.join("; "));
      else toast.success("Invite sent!");
      onUpdate();
    } finally {
      setActionLoading(false);
    }
  }

  async function completeHangout() {
    if (props.kind !== "hangout") return;
    setActionLoading(true);
    try {
      await fetch(`/api/hangouts/${props.data.id}/complete`, { method: "POST" });
      toast.success(`Marked hangout with ${name} as done!`);
      onUpdate();
    } finally {
      setActionLoading(false);
    }
  }

  async function skipHangout() {
    if (props.kind !== "hangout") return;
    setActionLoading(true);
    try {
      await fetch(`/api/hangouts/${props.data.id}/skip`, { method: "POST" });
      toast.info("Hangout skipped.");
      onUpdate();
    } finally {
      setActionLoading(false);
    }
  }

  const title =
    props.kind === "checkin"
      ? `Check-in with ${name}`
      : `Hangout with ${name}`;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-md max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:w-full max-sm:max-w-full">
        <div className="flex justify-center -mt-1 mb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-full border-2 border-[#1F2024] flex items-center justify-center shrink-0 crosshatch-light"
              style={{ backgroundColor: avatarColor.bg }}
            >
              <span className="text-sm font-bold" style={{ color: avatarColor.fg }}>
                {name[0]}{name.split(" ")[1]?.[0] ?? ""}
              </span>
            </div>
            <DialogTitle className="text-left">{title}</DialogTitle>
          </div>
        </DialogHeader>

        {props.kind === "checkin" && view === "detail" && (
          <CheckInDetailView
            data={props.data}
            onSend={props.onSend ? () => props.onSend!(props.data) : undefined}
            onSkip={skipCheckIn}
            onReschedule={() => setView("reschedule")}
          />
        )}

        {props.kind === "checkin" && view === "reschedule" && (
          <RescheduleView
            checkInId={props.data.id}
            onBack={() => setView("detail")}
            onUpdated={onUpdate}
          />
        )}

        {props.kind === "hangout" && view === "detail" && (
          <HangoutDetailView
            data={props.data}
            onEdit={() => setView("edit")}
            onSendInvite={sendHangoutInvite}
            onComplete={completeHangout}
            onSkip={skipHangout}
            sending={actionLoading}
          />
        )}

        {props.kind === "hangout" && view === "edit" && (
          <HangoutEditView
            data={props.data}
            onBack={() => setView("detail")}
            onUpdated={onUpdate}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
