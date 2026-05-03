"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const CATCHUP_FORMATS = [
  { id: "zoom", label: "Zoom" },
  { id: "facetime", label: "FaceTime" },
  { id: "in-person", label: "In Person" },
  { id: "phone", label: "Phone Call" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "text", label: "Text Message" },
];

const FREQUENCY_PRESETS = [
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
  { label: "1 month", days: 30 },
  { label: "3 months", days: 90 },
  { label: "6 months", days: 180 },
];

interface Props {
  contactId: string;
  initialFrequencyDays?: number;
  initialFormats?: string[];
  onSaved?: () => void;
}

export function ScheduleForm({
  contactId,
  initialFrequencyDays,
  initialFormats = [],
  onSaved,
}: Props) {
  const [frequencyDays, setFrequencyDays] = useState<number | "">(
    initialFrequencyDays ?? ""
  );
  const [selectedFormats, setSelectedFormats] = useState<string[]>(initialFormats);
  const [saving, setSaving] = useState(false);

  function toggleFormat(id: string) {
    setSelectedFormats((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    if (!frequencyDays || selectedFormats.length === 0) {
      toast.error("Please set a frequency and at least one catchup format");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frequencyDays: Number(frequencyDays),
          catchupFormats: selectedFormats,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Schedule saved!");
      onSaved?.();
    } catch {
      toast.error("Failed to save schedule");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setSaving(true);
    try {
      await fetch(`/api/contacts/${contactId}/schedule`, { method: "DELETE" });
      toast.info("Schedule removed");
      setFrequencyDays("");
      setSelectedFormats([]);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <Label className="mb-2 block">Check-in frequency</Label>
        <div className="flex flex-wrap gap-2 mb-3">
          {FREQUENCY_PRESETS.map((p) => (
            <button
              key={p.days}
              onClick={() => setFrequencyDays(p.days)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                frequencyDays === p.days
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-accent"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            placeholder="Custom days"
            value={
              frequencyDays !== "" &&
              !FREQUENCY_PRESETS.some((p) => p.days === frequencyDays)
                ? frequencyDays
                : ""
            }
            onChange={(e) =>
              setFrequencyDays(e.target.value ? Number(e.target.value) : "")
            }
            className="w-36"
          />
          <span className="text-sm text-muted-foreground">days</span>
        </div>
        {frequencyDays && (
          <p className="text-sm text-muted-foreground mt-1">
            Every {frequencyDays} day{Number(frequencyDays) !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      <div>
        <Label className="mb-2 block">Catchup formats</Label>
        <div className="flex flex-wrap gap-2">
          {CATCHUP_FORMATS.map((f) => (
            <button
              key={f.id}
              onClick={() => toggleFormat(f.id)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                selectedFormats.includes(f.id)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-accent"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {selectedFormats.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedFormats.map((f) => (
              <Badge key={f} variant="secondary" className="text-xs">
                {CATCHUP_FORMATS.find((c) => c.id === f)?.label ?? f}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {initialFrequencyDays ? "Update schedule" : "Set schedule"}
        </Button>
        {initialFrequencyDays && (
          <Button variant="outline" onClick={handleRemove} disabled={saving}>
            Remove schedule
          </Button>
        )}
      </div>
    </div>
  );
}
