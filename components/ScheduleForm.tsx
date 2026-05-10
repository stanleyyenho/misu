"use client";

import { useState } from "react";
import { HangoutInstancesEditor } from "@/components/HangoutInstancesEditor";
import { toast } from "sonner";
import { ActionButton } from "@/components/ui/action-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const TONES = [
  { id: "casual", label: "Casual" },
  { id: "warm", label: "Warm" },
  { id: "formal", label: "Formal" },
  { id: "playful", label: "Playful" },
];

interface Props {
  sectionMode: "check-in" | "hangout";
  contactId: string;
  contactPhone?: string | null;
  contactPlatform?: string | null;
  initialFrequencyDays?: number;
  initialTone?: string;
  initialApproveBeforeSend?: boolean;
  initialHangoutType?: string;
  initialCadenceMode?: string;
  initialLeadTimeDays?: number;
  initialDefaultHangout?: Record<string, unknown> | null;
  initialNoteToFriend?: string | null;
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
        backgroundColor: active ? "var(--button-fill)" : "transparent",
        color: active ? "#FFFFFF" : "#1F2024",
        boxShadow: active ? "2px 2px 0 #1F2024" : "none",
      }}
    >
      {children}
    </button>
  );
}

export function ScheduleForm({
  sectionMode,
  contactId,
  contactPhone,
  contactPlatform,
  initialFrequencyDays,
  initialTone = "casual",
  initialApproveBeforeSend = true,
  initialHangoutType = "in-person",
  initialCadenceMode = "prompt",
  initialLeadTimeDays = 7,
  initialDefaultHangout = null,
  initialNoteToFriend = null,
  onSaved,
}: Props) {
  const [frequencyDays, setFrequencyDays] = useState<number | "">(
    initialFrequencyDays ?? ""
  );
  const [platform, setPlatform] = useState(contactPlatform ?? "");
  const [tone, setTone] = useState(initialTone);
  const [approveBeforeSend, setApproveBeforeSend] = useState(initialApproveBeforeSend);
  const [hangoutType, setHangoutType] = useState(initialHangoutType);

  const resolvedInitialCadenceMode = () => {
    if (sectionMode === "check-in") return "prompt";
    if (initialCadenceMode === "perpetual" || initialCadenceMode === "planned") return initialCadenceMode;
    return "perpetual";
  };
  const [cadenceMode, setCadenceMode] = useState(resolvedInitialCadenceMode());

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
  const [includeNote, setIncludeNote] = useState(!!initialNoteToFriend);
  const [noteToFriend, setNoteToFriend] = useState(initialNoteToFriend ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!frequencyDays) {
      toast.error("Please set a check-in frequency");
      return;
    }
    setSaving(true);
    try {
      if (sectionMode === "check-in" && platform !== contactPlatform) {
        await fetch(`/api/contacts/${contactId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messagingPlatform: platform || null }),
        });
      }

      const effectiveCadenceMode = sectionMode === "check-in" ? "prompt" : cadenceMode;
      const scheduleType = sectionMode === "check-in" ? "check-in" : "hangout";

      let defaultHangout: Record<string, unknown> | null = null;
      if (effectiveCadenceMode === "perpetual") {
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
          scheduleType,
          frequencyDays: Number(frequencyDays),
          frequencyJitterDays: 0,
          tone,
          checkInType: "generic",
          approveBeforeSend,
          hangoutType: sectionMode === "check-in" ? "in-person" : hangoutType,
          cadenceMode: effectiveCadenceMode,
          leadTimeDays,
          defaultHangout,
          noteToFriend: sectionMode === "hangout" && includeNote && noteToFriend.trim() ? noteToFriend.trim() : null,
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
    const scheduleType = sectionMode === "check-in" ? "check-in" : "hangout";
    setSaving(true);
    try {
      await fetch(`/api/contacts/${contactId}/schedule?scheduleType=${scheduleType}`, { method: "DELETE" });
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
              onClick={() => setFrequencyDays(p.days)}
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
            }}
            className="w-24"
            style={{ borderRadius: "8px" }}
          />
          <span className="text-sm text-muted-foreground">days</span>
        </div>
      </div>

      {/* Messaging platform — check-in mode only */}
      {sectionMode === "check-in" && (
        <div>
          <Label className="mb-2 block text-xs font-bold uppercase tracking-wide">Send via</Label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "imessage", label: "iMessage" },
              { id: "sms", label: "SMS" },
              { id: "whatsapp", label: "WhatsApp" },
              { id: "instagram", label: "Instagram" },
              { id: "messenger", label: "Messenger" },
            ].map((p) => (
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
      )}

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

      {/* Hangout type — hangout section only */}
      {sectionMode === "hangout" && (
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
      )}

      {/* Cadence mode — hangout section only */}
      {sectionMode === "hangout" && (
        <div>
          <Label className="mb-2 block text-xs font-bold uppercase tracking-wide">Scheduling mode</Label>
          <div className="flex flex-wrap gap-2">
            <PillButton active={cadenceMode === "perpetual"} onClick={() => setCadenceMode("perpetual")}>
              Repeat same plan
            </PillButton>
            <PillButton active={cadenceMode === "planned"} onClick={() => setCadenceMode("planned")}>
              Pre-planned list
            </PillButton>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {cadenceMode === "perpetual" && "Misu auto-sends the same invite every cycle."}
            {cadenceMode === "planned" && "You pre-plan each hangout below; Misu sends them in order."}
          </p>
        </div>
      )}

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

      {/* Perpetual default hangout details — hangout section only */}
      {sectionMode === "hangout" && cadenceMode === "perpetual" && (
        <div className="space-y-3 rounded-[10px] border-2 border-[#1F2024] p-4" style={{ boxShadow: "2px 2px 0 #1F2024" }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide">
              Default hangout details <span className="text-muted-foreground font-semibold normal-case">(optional)</span>
            </p>
            {hangoutType === "in-person" && (
              <p className="text-xs text-muted-foreground mt-1">
                If you skip this, Misu will send you a push notification 3 days before the lead time to pick a location. If you don&apos;t pick one in time, the invite goes out with the location as &quot;TBD&quot; and you&apos;ll get a daily reminder until you set one.
              </p>
            )}
          </div>
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

      {sectionMode === "hangout" && cadenceMode === "planned" && initialCadenceMode === "planned" && (
        <div className="pt-1">
          <div className="my-3 h-px bg-border" />
          <HangoutInstancesEditor contactId={contactId} hangoutType={hangoutType} />
        </div>
      )}
      {sectionMode === "hangout" && cadenceMode === "planned" && initialCadenceMode !== "planned" && (
        <p className="text-xs text-muted-foreground rounded-[8px] border border-dashed border-[#DEDEDE] p-3">
          Save your cadence below first — your planned hangout slots will appear here.
        </p>
      )}

      {/* Personal note — hangout section only */}
      {sectionMode === "hangout" && (
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Label className="text-xs font-bold uppercase tracking-wide">Include a personal note</Label>
            <button
              type="button"
              onClick={() => setIncludeNote((v) => !v)}
              className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-[#1F2024] transition-colors"
              style={{ backgroundColor: includeNote ? "var(--button-fill)" : "transparent" }}
              aria-checked={includeNote}
              role="switch"
            >
              <span
                className="pointer-events-none inline-block h-3 w-3 rounded-full bg-[#1F2024] shadow transition-transform"
                style={{
                  transform: includeNote ? "translateX(16px)" : "translateX(2px)",
                  backgroundColor: includeNote ? "#FFFFFF" : "#1F2024",
                }}
              />
            </button>
          </div>
          {includeNote && (
            <Textarea
              placeholder="e.g. Can't wait to see you!"
              rows={2}
              value={noteToFriend}
              onChange={(e) => setNoteToFriend(e.target.value)}
              style={{ borderRadius: "8px" }}
            />
          )}
          <p className="text-xs text-muted-foreground mt-1.5">
            Included at the end of every invite sent to this contact
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <ActionButton onClick={handleSave} disabled={saving || !frequencyDays}>
          {saving ? "Saving..." : initialFrequencyDays ? "Update cadence" : "Set cadence"}
        </ActionButton>
        {initialFrequencyDays && (
          <ActionButton variant="outline" onClick={handleRemove} disabled={saving}>
            Remove
          </ActionButton>
        )}
      </div>
    </div>
  );
}
