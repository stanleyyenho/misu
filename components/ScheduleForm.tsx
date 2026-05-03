"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      const res = await fetch(`/api/contacts/${contactId}/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frequencyDays: Number(frequencyDays),
          frequencyJitterDays: clampedJitter,
          tone,
          checkInType,
          approveBeforeSend,
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
