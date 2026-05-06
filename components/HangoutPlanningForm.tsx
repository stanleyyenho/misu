"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ActionButton } from "@/components/ui/action-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LocationSearch, type LocationResult } from "@/components/LocationSearch";

const DIGITAL_PLATFORMS = [
  { id: "facetime", label: "FaceTime" },
  { id: "zoom", label: "Zoom" },
  { id: "google-meet", label: "Google Meet" },
  { id: "teams", label: "Teams" },
  { id: "other", label: "Other" },
];

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

interface Props {
  contactId: string;
  contactName: string;
  checkInId?: string;
  onCreated?: () => void;
}

export function HangoutPlanningForm({
  contactId,
  contactName,
  checkInId,
  onCreated,
}: Props) {
  const [type, setType] = useState<"in-person" | "digital">("in-person");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationAddr, setLocationAddr] = useState("");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [platform, setPlatform] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!date || !time) {
      toast.error("Please pick a date and time");
      return;
    }
    if (type === "in-person" && !locationName) {
      toast.error("Please enter a location");
      return;
    }
    if (type === "digital" && !platform) {
      toast.error("Please choose a platform");
      return;
    }

    const datetime = new Date(`${date}T${time}:00`);
    if (isNaN(datetime.getTime())) {
      toast.error("Invalid date or time");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/hangouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId,
          checkInId: checkInId ?? null,
          type,
          date: datetime.toISOString(),
          locationName: type === "in-person" ? locationName : null,
          locationAddr: type === "in-person" ? locationAddr || null : null,
          locationLat: type === "in-person" ? locationLat : null,
          locationLng: type === "in-person" ? locationLng : null,
          platform: type === "digital" ? platform : null,
          meetingLink: type === "digital" ? meetingLink || null : null,
          noteToFriend: note || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create hangout");
      toast.success(`Hangout with ${contactName} planned for ${format(datetime, "MMM d 'at' h:mm a")}`);
      // Reset form
      setType("in-person");
      setDate("");
      setTime("");
      setLocationName("");
      setLocationAddr("");
      setLocationLat(null);
      setLocationLng(null);
      setPlatform("");
      setMeetingLink("");
      setNote("");
      onCreated?.();
    } catch {
      toast.error("Failed to plan hangout");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Type */}
      <div>
        <Label className="mb-2 block text-xs font-bold uppercase tracking-wide">Type</Label>
        <div className="flex gap-2">
          <PillButton active={type === "in-person"} onClick={() => setType("in-person")}>
            In-person
          </PillButton>
          <PillButton active={type === "digital"} onClick={() => setType("digital")}>
            Digital
          </PillButton>
        </div>
      </div>

      {/* Date + time — stacked to avoid overflow on mobile */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="hangout-date" className="mb-1.5 block text-xs font-bold uppercase tracking-wide">
            Date
          </Label>
          <Input
            id="hangout-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full"
            style={{ borderRadius: "8px" }}
          />
        </div>
        <div>
          <Label htmlFor="hangout-time" className="mb-1.5 block text-xs font-bold uppercase tracking-wide">
            Time
          </Label>
          <Input
            id="hangout-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full"
            style={{ borderRadius: "8px" }}
          />
        </div>
      </div>

      {/* In-person fields */}
      {type === "in-person" && (
        <div>
          <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wide">
            Venue
          </Label>
          <LocationSearch
            value={locationName}
            onChange={(val) => {
              setLocationName(val);
              if (locationLat !== null) { setLocationLat(null); setLocationLng(null); setLocationAddr(""); }
            }}
            onSelect={(r: LocationResult) => {
              setLocationName(r.name);
              setLocationAddr(r.address);
              setLocationLat(r.lat);
              setLocationLng(r.lng);
            }}
          />
          {locationAddr && (
            <p className="mt-1 text-xs text-muted-foreground truncate">{locationAddr}</p>
          )}
        </div>
      )}

      {/* Digital fields */}
      {type === "digital" && (
        <>
          <div>
            <Label className="mb-2 block text-xs font-bold uppercase tracking-wide">Platform</Label>
            <div className="flex flex-wrap gap-2">
              {DIGITAL_PLATFORMS.map((p) => (
                <PillButton
                  key={p.id}
                  active={platform === p.id}
                  onClick={() => setPlatform(p.id)}
                >
                  {p.label}
                </PillButton>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="meeting-link" className="mb-1.5 block text-xs font-bold uppercase tracking-wide">
              Meeting link <span className="font-normal normal-case text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="meeting-link"
              type="url"
              placeholder="https://zoom.us/j/..."
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              style={{ borderRadius: "8px" }}
            />
          </div>
        </>
      )}

      {/* Note */}
      <div>
        <Label htmlFor="hangout-note" className="mb-1.5 block text-xs font-bold uppercase tracking-wide">
          Note to {contactName} <span className="font-normal normal-case text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="hangout-note"
          placeholder="Add a personal note to include in the invite..."
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ borderRadius: "8px" }}
        />
      </div>

      <ActionButton onClick={handleSubmit} disabled={saving}>
        {saving ? "Saving..." : "Save hangout"}
      </ActionButton>
    </div>
  );
}
