"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ActionButton } from "@/components/ui/action-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationSearch, type LocationResult } from "@/components/LocationSearch";

const MAX_INSTANCES = 5;

const DIGITAL_PLATFORMS = [
  { id: "facetime", label: "FaceTime" },
  { id: "zoom", label: "Zoom" },
  { id: "google-meet", label: "Google Meet" },
  { id: "teams", label: "Teams" },
  { id: "other", label: "Other" },
];

function PillButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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

interface Instance {
  instanceNum: number;
  date: string;
  time: string;
  locationName: string;
  locationAddr: string;
  locationLat: number | null;
  locationLng: number | null;
  platform: string;
  meetingLink: string;
  // from API — present if already activated
  hangoutId?: string | null;
}

interface Props {
  contactId: string;
  hangoutType: string;
}

function emptyInstance(instanceNum: number): Instance {
  return { instanceNum, date: "", time: "", locationName: "", locationAddr: "", locationLat: null, locationLng: null, platform: "", meetingLink: "" };
}

export function HangoutInstancesEditor({ contactId, hangoutType }: Props) {
  const [instances, setInstances] = useState<Instance[]>([emptyInstance(1)]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/contacts/${contactId}/schedule/instances`)
      .then((r) => r.json())
      .then((data: Array<Instance & { date: string }>) => {
        if (Array.isArray(data) && data.length > 0) {
          setInstances(
            data.map((d) => ({
              ...d,
              date: d.date ? format(new Date(d.date), "yyyy-MM-dd") : "",
              time: d.date ? format(new Date(d.date), "HH:mm") : "",
              locationName: d.locationName ?? "",
              locationAddr: d.locationAddr ?? "",
              locationLat: d.locationLat ?? null,
              locationLng: d.locationLng ?? null,
              platform: d.platform ?? "",
              meetingLink: d.meetingLink ?? "",
            }))
          );
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [contactId]);

  function update(index: number, patch: Partial<Instance>) {
    setInstances((prev) => prev.map((inst, i) => (i === index ? { ...inst, ...patch } : inst)));
  }

  function addInstance() {
    if (instances.length >= MAX_INSTANCES) return;
    setInstances((prev) => [...prev, emptyInstance(prev.length + 1)]);
  }

  function removeInstance(index: number) {
    setInstances((prev) =>
      prev.filter((_, i) => i !== index).map((inst, i) => ({ ...inst, instanceNum: i + 1 }))
    );
  }

  async function handleSave() {
    for (const inst of instances) {
      if (!inst.date || !inst.time) {
        toast.error(`Instance ${inst.instanceNum} is missing a date or time`);
        return;
      }
      if (hangoutType === "in-person" && !inst.locationName) {
        toast.error(`Instance ${inst.instanceNum} needs a venue`);
        return;
      }
      if (hangoutType === "digital" && !inst.platform) {
        toast.error(`Instance ${inst.instanceNum} needs a platform`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = instances.map((inst) => ({
        instanceNum: inst.instanceNum,
        date: new Date(`${inst.date}T${inst.time}:00`).toISOString(),
        locationName: inst.locationName || undefined,
        locationAddr: inst.locationAddr || undefined,
        locationLat: inst.locationLat ?? undefined,
        locationLng: inst.locationLng ?? undefined,
        platform: inst.platform || undefined,
        meetingLink: inst.meetingLink || undefined,
      }));

      const res = await fetch(`/api/contacts/${contactId}/schedule/instances`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instances: payload }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Planned hangouts saved!");
    } catch {
      toast.error("Failed to save planned hangouts");
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">Planned hangouts</h2>
        <span className="text-xs text-muted-foreground">{instances.length}/{MAX_INSTANCES}</span>
      </div>

      <div className="space-y-4">
        {instances.map((inst, i) => (
          <div
            key={inst.instanceNum}
            className="rounded-[10px] border-2 border-[#1F2024] p-4 space-y-3"
            style={{ boxShadow: "2px 2px 0 #1F2024" }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">#{inst.instanceNum}</p>
              {!inst.hangoutId && instances.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeInstance(i)}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Remove
                </button>
              )}
              {inst.hangoutId && (
                <span className="text-xs text-muted-foreground italic">Invite sent</span>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="mb-1 block text-xs font-semibold">Date</Label>
                <Input type="date" value={inst.date} onChange={(e) => update(i, { date: e.target.value })} disabled={!!inst.hangoutId} style={{ borderRadius: "8px" }} />
              </div>
              <div className="flex-1">
                <Label className="mb-1 block text-xs font-semibold">Time</Label>
                <Input type="time" value={inst.time} onChange={(e) => update(i, { time: e.target.value })} disabled={!!inst.hangoutId} style={{ borderRadius: "8px" }} />
              </div>
            </div>

            {hangoutType === "in-person" ? (
              <div>
                <Label className="mb-1 block text-xs font-semibold">Venue</Label>
                {inst.hangoutId ? (
                  <p className="text-sm">{inst.locationName || "—"}</p>
                ) : (
                  <>
                    <LocationSearch
                      value={inst.locationName}
                      onChange={(val) => update(i, { locationName: val, locationLat: null, locationLng: null, locationAddr: "" })}
                      onSelect={(r: LocationResult) => update(i, { locationName: r.name, locationAddr: r.address, locationLat: r.lat, locationLng: r.lng })}
                    />
                    {inst.locationAddr && <p className="mt-1 text-xs text-muted-foreground truncate">{inst.locationAddr}</p>}
                  </>
                )}
              </div>
            ) : (
              <>
                <div>
                  <Label className="mb-1 block text-xs font-semibold">Platform</Label>
                  <div className="flex flex-wrap gap-2">
                    {DIGITAL_PLATFORMS.map((p) => (
                      <PillButton key={p.id} active={inst.platform === p.id} onClick={() => !inst.hangoutId && update(i, { platform: p.id })}>
                        {p.label}
                      </PillButton>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="mb-1 block text-xs font-semibold">Meeting link (optional)</Label>
                  <Input type="url" placeholder="https://..." value={inst.meetingLink} onChange={(e) => update(i, { meetingLink: e.target.value })} disabled={!!inst.hangoutId} style={{ borderRadius: "8px" }} />
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {instances.length < MAX_INSTANCES && (
          <ActionButton variant="outline" size="sm" onClick={addInstance}>
            + Add instance
          </ActionButton>
        )}
        <ActionButton size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save planned hangouts"}
        </ActionButton>
      </div>
    </div>
  );
}
