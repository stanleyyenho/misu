"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationSearch, type LocationResult } from "@/components/LocationSearch";

const LEAD_TIME_PRESETS = [
  { label: "3 days", days: 3 },
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
];

const DIGITAL_PLATFORMS = [
  { id: "facetime", label: "FaceTime" },
  { id: "zoom", label: "Zoom" },
  { id: "google-meet", label: "Google Meet" },
  { id: "teams", label: "Teams" },
  { id: "other", label: "Other" },
];

const FREQUENCY_PRESETS = [
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
  { label: "1 month", days: 30 },
  { label: "3 months", days: 90 },
  { label: "6 months", days: 180 },
];

const JITTER_PRESETS = [
  { label: "none", days: 0 },
  { label: "1 day", days: 1 },
  { label: "2 days", days: 2 },
  { label: "3 days", days: 3 },
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
  { label: "1 month", days: 30 },
];

function maxJitter(frequencyDays: number | ""): number {
  if (!frequencyDays) return 0;
  return Math.floor(Number(frequencyDays) / 2);
}

const PLATFORMS = [
  { id: "imessage", label: "iMessage" },
  { id: "sms", label: "SMS" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "instagram", label: "Instagram" },
  { id: "messenger", label: "Messenger" },
];

const TONES = [
  { id: "casual", label: "Casual" },
  { id: "warm", label: "Warm" },
  { id: "formal", label: "Formal" },
  { id: "playful", label: "Playful" },
];

interface Props {
  contactId: string;
  contactPhone?: string | null;
  contactPlatform?: string | null;
  initialFrequencyDays?: number;
  initialFrequencyJitterDays?: number;
  initialTone?: string;
  initialCheckInType?: string;
  initialApproveBeforeSend?: boolean;
  initialHangoutType?: string;
  initialCadenceMode?: string;
  initialLeadTimeDays?: number;
  initialDefaultHangout?: Record<string, unknown> | null;
  onSaved?: () => void;
}

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
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

export function ScheduleForm({
  contactId,
  contactPhone,
  contactPlatform,
  initialFrequencyDays,
  initialFrequencyJitterDays = 0,
  initialTone = "casual",
  initialCheckInType = "generic",
  initialApproveBeforeSend = true,
  initialHangoutType = "in-person",
  initialCadenceMode = "prompt",
  initialLeadTimeDays = 7,
  initialDefaultHangout = null,
  onSaved,
}: Props) {
  const [frequencyDays, setFrequencyDays] = useState<number | "">(
    initialFrequencyDays ?? ""
  );
  const [frequencyJitterDays, setFrequencyJitterDays] = useState<number>(
    initialFrequencyJitterDays
  );
  const [platform, setPlatform] = useState(contactPlatform ?? "");
  const [tone, setTone] = useState(initialTone);
  const [checkInType, setCheckInType] = useState(initialCheckInType);
  const [approveBeforeSend, setApproveBeforeSend] = useState(initialApproveBeforeSend);
  const [hangoutType, setHangoutType] = useState(initialHangoutType);
  const [cadenceMode, setCadenceMode] = useState(initialCadenceMode);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(initialLeadTimeDays);
  const [defaultLocationName, setDefaultLocationName] = useState<string>(
    (initialDefaultHangout?.locationName as string) ?? ""
  );
  const [defaultLocationAddr, setDefaultLocationAddr] = useState<string>(
    (initialDefaultHangout?.locationAddr as string) ?? ""
  );
  const [defaultLocationLat, setDefaultLocationLat] = useState<number | null>(
    (initialDefaultHangout?.locationLat as number) ?? null
  );
  const [defaultLocationLng, setDefaultLocationLng] = useState<number | null>(
    (initialDefaultHangout?.locationLng as number) ?? null
  );
  const [defaultPlatform, setDefaultPlatform] = useState<string>(
    (initialDefaultHangout?.platform as string) ?? ""
  );
  const [defaultMeetingLink, setDefaultMeetingLink] = useState<string>(
    (initialDefaultHangout?.meetingLink as string) ?? ""
  );
  const [defaultTime, setDefaultTime] = useState<string>(
    (initialDefaultHangout?.time as string) ?? ""
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!frequencyDays) {
      toast.error("Please set a check-in frequency");
      return;
    }
    setSaving(true);
    try {
      // Update the contact's messaging platform if changed
      if (platform !== contactPlatform) {
        await fetch(`/api/contacts/${contactId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messagingPlatform: platform || null }),
        });
      }

      const clampedJitter = Math.min(frequencyJitterDays, maxJitter(frequencyDays));

      let defaultHangout: Record<string, unknown> | null = null;
      if (cadenceMode === "perpetual") {
        defaultHangout = {
          locationName: defaultLocationName || null,
          locationAddr: defaultLocationAddr || null,
          locationLat: defaultLocationLat,
          locationLng: defaultLocationLng,
          platform: defaultPlatform || null,
          meetingLink: defaultMeetingLink || null,
          time: defaultTime || null,
        };
      }

      const res = await fetch(`/api/contacts/${contactId}/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frequencyDays: Number(frequencyDays),
          frequencyJitterDays: clampedJitter,
          tone,
          checkInType,
          approveBeforeSend,
          hangoutType,
          cadenceMode,
          leadTimeDays,
          defaultHangout,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Cadence saved!");
      onSaved?.();
    } catch {
      toast.error("Failed to save cadence");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setSaving(true);
    try {
      await fetch(`/api/contacts/${contactId}/schedule`, { method: "DELETE" });
      toast.info("Cadence removed");
      setFrequencyDays("");
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Frequency */}
      <div>
        <Label className="mb-2 block text-xs font-bold uppercase tracking-wide">Check-in frequency</Label>
        <div className="flex flex-wrap gap-2 mb-3">
          {FREQUENCY_PRESETS.map((p) => (
            <PillButton
              key={p.days}
              active={frequencyDays === p.days}
              onClick={() => {
                setFrequencyDays(p.days);
                setFrequencyJitterDays((j) => Math.min(j, maxJitter(p.days)));
              }}
            >
              {p.label}
            </PillButton>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            placeholder="Custom"
            value={
              frequencyDays !== "" &&
              !FREQUENCY_PRESETS.some((p) => p.days === frequencyDays)
                ? frequencyDays
                : ""
            }
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : "";
              setFrequencyDays(val);
              if (val !== "") setFrequencyJitterDays((j) => Math.min(j, maxJitter(val)));
            }}
            className="w-24"
            style={{ borderRadius: "8px" }}
          />
          <span className="text-sm text-muted-foreground">days</span>
        </div>
      </div>

      {/* Jitter */}
      {frequencyDays !== "" && maxJitter(frequencyDays) >= 1 && (
        <div>
          <Label className="mb-1 block text-xs font-bold uppercase tracking-wide">Give or take</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Misu will schedule each check-in randomly within this window to feel more natural
          </p>
          <div className="flex flex-wrap gap-2">
            {JITTER_PRESETS.filter((j) => j.days <= maxJitter(frequencyDays)).map((j) => (
              <PillButton
                key={j.days}
                active={frequencyJitterDays === j.days}
                onClick={() => setFrequencyJitterDays(j.days)}
              >
                {j.label}
              </PillButton>
            ))}
          </div>
        </div>
      )}

      {/* Messaging platform */}
      <div>
        <Label className="mb-2 block text-xs font-bold uppercase tracking-wide">Send via</Label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <PillButton
              key={p.id}
              active={platform === p.id}
              onClick={() => setPlatform(platform === p.id ? "" : p.id)}
            >
              {p.label}
            </PillButton>
          ))}
        </div>
        {!contactPhone && platform === "sms" && (
          <p className="text-xs text-[var(--destructive)] mt-1.5 font-semibold">
            Add a phone number to this contact to use SMS
          </p>
        )}
      </div>

      {/* Message tone */}
      <div>
        <Label className="mb-2 block text-xs font-bold uppercase tracking-wide">Message tone</Label>
        <div className="flex flex-wrap gap-2">
          {TONES.map((t) => (
            <PillButton
              key={t.id}
              active={tone === t.id}
              onClick={() => setTone(t.id)}
            >
              {t.label}
            </PillButton>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          Controls how the AI writes your check-in messages
        </p>
      </div>

      {/* Check-in type */}
      <div>
        <Label className="mb-2 block text-xs font-bold uppercase tracking-wide">Check-in type</Label>
        <div className="flex flex-wrap gap-2">
          <PillButton
            active={checkInType === "generic"}
            onClick={() => setCheckInType("generic")}
          >
            Generic
          </PillButton>
          <PillButton
            active={checkInType === "hangout-prompt"}
            onClick={() => setCheckInType("hangout-prompt")}
          >
            Hangout prompt
          </PillButton>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          {checkInType === "generic"
            ? '"How have you been?" style messages'
            : '"We need to hang soon" style messages with venue suggestions'}
        </p>
      </div>

      {/* Approve before send */}
      <div>
        <Label className="mb-2 block text-xs font-bold uppercase tracking-wide">Delivery mode</Label>
        <div className="flex flex-wrap gap-2">
          <PillButton
            active={approveBeforeSend}
            onClick={() => setApproveBeforeSend(true)}
          >
            Review before send
          </PillButton>
          <PillButton
            active={!approveBeforeSend}
            onClick={() => setApproveBeforeSend(false)}
          >
            Auto-send
          </PillButton>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          {approveBeforeSend
            ? "You'll get a notification to review the message before it sends"
            : "SMS messages send automatically (requires Twilio)"}
        </p>
      </div>

      {/* Hangout type */}
      <div>
        <Label className="mb-2 block text-xs font-bold uppercase tracking-wide">Hangout type</Label>
        <div className="flex gap-2">
          <PillButton active={hangoutType === "in-person"} onClick={() => setHangoutType("in-person")}>
            In-person
          </PillButton>
          <PillButton active={hangoutType === "digital"} onClick={() => setHangoutType("digital")}>
            Digital
          </PillButton>
        </div>
      </div>

      {/* Cadence mode */}
      <div>
        <Label className="mb-2 block text-xs font-bold uppercase tracking-wide">Scheduling mode</Label>
        <div className="flex flex-wrap gap-2">
          <PillButton active={cadenceMode === "prompt"} onClick={() => setCadenceMode("prompt")}>
            Prompt me
          </PillButton>
          <PillButton active={cadenceMode === "perpetual"} onClick={() => setCadenceMode("perpetual")}>
            Repeat same plan
          </PillButton>
          <PillButton active={cadenceMode === "planned"} onClick={() => setCadenceMode("planned")}>
            Pre-planned list
          </PillButton>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          {cadenceMode === "prompt" && "Misu notifies you when it's time — you pick the spot and send the invite."}
          {cadenceMode === "perpetual" && "Misu auto-sends the same invite every cycle."}
          {cadenceMode === "planned" && "You pre-plan each hangout below; Misu sends them in order."}
        </p>
      </div>

      {/* Lead time */}
      <div>
        <Label className="mb-2 block text-xs font-bold uppercase tracking-wide">Lead time</Label>
        <div className="flex flex-wrap gap-2">
          {LEAD_TIME_PRESETS.map((p) => (
            <PillButton key={p.days} active={leadTimeDays === p.days} onClick={() => setLeadTimeDays(p.days)}>
              {p.label}
            </PillButton>
          ))}
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              placeholder="Custom"
              value={!LEAD_TIME_PRESETS.some((p) => p.days === leadTimeDays) ? leadTimeDays : ""}
              onChange={(e) => { if (e.target.value) setLeadTimeDays(Number(e.target.value)); }}
              className="w-20"
              style={{ borderRadius: "8px" }}
            />
            <span className="text-sm text-muted-foreground">days before</span>
          </div>
        </div>
      </div>

      {/* Perpetual default hangout details */}
      {cadenceMode === "perpetual" && (
        <div className="space-y-3 rounded-[10px] border-2 border-[#1F2024] p-4" style={{ boxShadow: "2px 2px 0 #1F2024" }}>
          <p className="text-xs font-bold uppercase tracking-wide">Default hangout details</p>
          {hangoutType === "in-person" ? (
            <div>
              <Label className="mb-1.5 block text-xs font-semibold">Venue</Label>
              <LocationSearch
                value={defaultLocationName}
                onChange={(val) => {
                  setDefaultLocationName(val);
                  if (defaultLocationLat !== null) { setDefaultLocationLat(null); setDefaultLocationLng(null); setDefaultLocationAddr(""); }
                }}
                onSelect={(r: LocationResult) => {
                  setDefaultLocationName(r.name);
                  setDefaultLocationAddr(r.address);
                  setDefaultLocationLat(r.lat);
                  setDefaultLocationLng(r.lng);
                }}
                placeholder="Search for a venue..."
              />
              {defaultLocationAddr && (
                <p className="mt-1 text-xs text-muted-foreground truncate">{defaultLocationAddr}</p>
              )}
            </div>
          ) : (
            <>
              <div>
                <Label className="mb-1.5 block text-xs font-semibold">Platform</Label>
                <div className="flex flex-wrap gap-2">
                  {DIGITAL_PLATFORMS.map((p) => (
                    <PillButton key={p.id} active={defaultPlatform === p.id} onClick={() => setDefaultPlatform(p.id)}>
                      {p.label}
                    </PillButton>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-semibold">Meeting link (optional)</Label>
                <Input
                  type="url"
                  placeholder="https://zoom.us/j/..."
                  value={defaultMeetingLink}
                  onChange={(e) => setDefaultMeetingLink(e.target.value)}
                  style={{ borderRadius: "8px" }}
                />
              </div>
            </>
          )}
          <div>
            <Label className="mb-1.5 block text-xs font-semibold">Default time</Label>
            <Input
              type="time"
              value={defaultTime}
              onChange={(e) => setDefaultTime(e.target.value)}
              className="w-36"
              style={{ borderRadius: "8px" }}
            />
          </div>
        </div>
      )}

      {cadenceMode === "planned" && (
        <p className="text-xs text-muted-foreground rounded-[8px] border border-dashed border-[#DEDEDE] p-3">
          Save your cadence first, then use the <strong>Planned hangouts</strong> section below to add up to 10 instances.
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          onClick={handleSave}
          disabled={saving || !frequencyDays}
          style={{ borderRadius: "8px" }}
        >
          {saving ? "Saving..." : initialFrequencyDays ? "Update cadence" : "Set cadence"}
        </Button>
        {initialFrequencyDays && (
          <Button
            variant="outline"
            onClick={handleRemove}
            disabled={saving}
            style={{ borderRadius: "8px" }}
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
