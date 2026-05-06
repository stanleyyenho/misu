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
import { ActionButton } from "@/components/ui/action-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScheduleForm } from "@/components/ScheduleForm";
import { getAvatarColor } from "@/lib/avatar-color";

export interface RecurringSchedule {
  id: string;
  contactId: string;
  frequencyDays: number;
  nextCheckIn: string;
  cadenceMode: string;
  hangoutType: string;
  leadTimeDays: number;
  defaultHangout: string | null;
  noteToFriend: string | null;
  tone: string;
  approveBeforeSend: boolean;
  contact: {
    id: string;
    firstName: string;
    lastName: string | null;
    phone: string | null;
    messagingPlatform: string | null;
  };
}

interface Props {
  schedule: RecurringSchedule | null;
  onClose: () => void;
  onUpdate: () => void;
}

type View = "detail" | "edit" | "raincheck";

const CADENCE_LABELS: Record<string, string> = {
  perpetual: "Repeat same plan",
  planned: "Pre-planned list",
};

export function RecurringHangoutDetailModal({ schedule, onClose, onUpdate }: Props) {
  const [view, setView] = useState<View>("detail");
  const [raindcheckDate, setRaincheckDate] = useState("");
  const [saving, setSaving] = useState(false);

  if (!schedule) return null;
  const s = schedule;

  const name = [s.contact.firstName, s.contact.lastName].filter(Boolean).join(" ");
  const avatarColor = getAvatarColor(name);

  function handleClose() {
    setView("detail");
    setRaincheckDate("");
    onClose();
  }

  function handleUpdated() {
    setView("detail");
    setRaincheckDate("");
    onUpdate();
  }

  async function handleRaincheck() {
    if (!raindcheckDate) { toast.error("Pick a new date"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/contacts/${s.contactId}/schedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleType: "hangout", nextCheckIn: new Date(raindcheckDate).toISOString() }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Next hangout rescheduled to ${format(new Date(raindcheckDate), "MMM d, yyyy")}`);
      handleUpdated();
    } catch {
      toast.error("Failed to reschedule");
    } finally {
      setSaving(false);
    }
  }

  const nextDate = new Date(s.nextCheckIn);

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
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
            <DialogTitle className="text-left" style={{ fontFamily: "var(--font-sans)" }}>
              Recurring hangout with {name}
            </DialogTitle>
          </div>
        </DialogHeader>

        {view === "detail" && (
          <div className="space-y-4 pt-1">
            <div
              className="rounded-[10px] border-2 border-[#1F2024] p-4 space-y-2"
              style={{ boxShadow: "2px 2px 0 #1F2024" }}
            >
              <p className="text-sm font-bold">
                Next hangout: {format(nextDate, "EEEE, MMMM d, yyyy")}
              </p>
              <p className="text-sm text-muted-foreground">
                Every <strong>{s.frequencyDays}</strong> days
                {" · "}
                {s.hangoutType === "in-person" ? "In-person" : "Digital"}
              </p>
              {s.cadenceMode && (
                <p className="text-sm text-muted-foreground">
                  {CADENCE_LABELS[s.cadenceMode] ?? s.cadenceMode}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <ActionButton onClick={() => setView("edit")}>
                Edit cadence
              </ActionButton>
              <ActionButton variant="outline" onClick={() => setView("raincheck")}>
                Raincheck — push it back
              </ActionButton>
            </div>
          </div>
        )}

        {view === "raincheck" && (
          <div className="space-y-4 pt-1">
            <p className="text-sm text-muted-foreground">
              Currently scheduled for <strong>{format(nextDate, "MMM d, yyyy")}</strong>. Pick a new date:
            </p>
            <div>
              <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wide">New date</Label>
              <Input
                type="date"
                value={raindcheckDate}
                onChange={(e) => setRaincheckDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
                style={{ borderRadius: "8px" }}
              />
            </div>
            <div className="flex gap-2">
              <ActionButton variant="ghost" onClick={() => setView("detail")}>
                ← Back
              </ActionButton>
              <ActionButton onClick={handleRaincheck} disabled={!raindcheckDate || saving}>
                {saving ? "Saving…" : "Reschedule"}
              </ActionButton>
            </div>
          </div>
        )}

        {view === "edit" && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setView("detail")}
              className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
            >
              ← Back
            </button>
            <ScheduleForm
              sectionMode="hangout"
              contactId={s.contactId}
              contactPhone={s.contact.phone}
              contactPlatform={s.contact.messagingPlatform}
              initialFrequencyDays={s.frequencyDays}
              initialTone={s.tone}
              initialApproveBeforeSend={s.approveBeforeSend}
              initialHangoutType={s.hangoutType}
              initialCadenceMode={s.cadenceMode}
              initialLeadTimeDays={s.leadTimeDays}
              initialDefaultHangout={
                s.defaultHangout ? JSON.parse(s.defaultHangout) : null
              }
              initialNoteToFriend={s.noteToFriend}
              onSaved={handleUpdated}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
