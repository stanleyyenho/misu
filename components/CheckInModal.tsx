"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const FORMAT_LABELS: Record<string, string> = {
  zoom: "Zoom",
  facetime: "FaceTime",
  "in-person": "In Person",
  phone: "Phone Call",
  whatsapp: "WhatsApp",
  text: "Text Message",
};

interface CheckIn {
  id: string;
  scheduledAt: string;
  contact: {
    firstName: string;
    lastName: string | null;
    email: string | null;
    avatarUrl: string | null;
    schedule: { catchupFormats: string } | null;
  };
}

interface Props {
  checkIn: CheckIn;
  onClose: () => void;
  onUpdate: () => void;
}

export function CheckInModal({ checkIn, onClose, onUpdate }: Props) {
  const [view, setView] = useState<"main" | "complete" | "reschedule">("main");
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);

  const name = [checkIn.contact.firstName, checkIn.contact.lastName]
    .filter(Boolean)
    .join(" ");

  const formats: string[] = checkIn.contact.schedule
    ? JSON.parse(checkIn.contact.schedule.catchupFormats)
    : [];

  async function handleComplete() {
    setLoading(true);
    try {
      await fetch(`/api/checkins/${checkIn.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: selectedFormat || null, notes: notes || null }),
      });
      toast.success(`Marked check-in with ${name} as done!`);
      onUpdate();
    } finally {
      setLoading(false);
    }
  }

  async function handleSkip() {
    setLoading(true);
    try {
      await fetch(`/api/checkins/${checkIn.id}/skip`, { method: "POST" });
      toast.info(`Skipped check-in with ${name}`);
      onUpdate();
    } finally {
      setLoading(false);
    }
  }

  async function handleReschedule() {
    if (!rescheduleDate) return;
    setLoading(true);
    try {
      await fetch(`/api/checkins/${checkIn.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: rescheduleDate.toISOString() }),
      });
      toast.success(`Rescheduled check-in with ${name}`);
      onUpdate();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-md max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:w-full max-sm:max-w-full">
        {/* Bottom sheet drag handle — mobile only */}
        <div className="flex justify-center -mt-1 mb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <DialogHeader>
          <DialogTitle>Check in with {name}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Scheduled for {format(new Date(checkIn.scheduledAt), "MMMM d, yyyy")}
          </p>
        </DialogHeader>

        {view === "main" && (
          <div className="space-y-4">
            {formats.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Preferred formats</p>
                <div className="flex flex-wrap gap-2">
                  {formats.map((f) => (
                    <Badge key={f} variant="secondary">
                      {FORMAT_LABELS[f] ?? f}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {checkIn.contact.email && (
              <p className="text-sm text-muted-foreground">
                {checkIn.contact.email}
              </p>
            )}
            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button onClick={() => setView("complete")} className="flex-1">
                Mark Complete
              </Button>
              <Button
                variant="outline"
                onClick={() => setView("reschedule")}
                className="flex-1"
              >
                Reschedule
              </Button>
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={loading}
                className="flex-1"
              >
                Skip
              </Button>
            </DialogFooter>
          </div>
        )}

        {view === "complete" && (
          <div className="space-y-4">
            {formats.length > 0 && (
              <div>
                <Label>How did you catch up?</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formats.map((f) => (
                    <button
                      key={f}
                      onClick={() => setSelectedFormat(f)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        selectedFormat === f
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {FORMAT_LABELS[f] ?? f}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did it go?"
                className="mt-1"
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setView("main")}>
                Back
              </Button>
              <Button onClick={handleComplete} disabled={loading}>
                Confirm
              </Button>
            </DialogFooter>
          </div>
        )}

        {view === "reschedule" && (
          <div className="space-y-4">
            <Label>Pick a new date</Label>
            <Popover>
              <PopoverTrigger
                className="flex h-9 w-full items-center justify-start rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs hover:bg-accent hover:text-accent-foreground"
              >
                {rescheduleDate
                  ? format(rescheduleDate, "MMMM d, yyyy")
                  : "Select date"}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={rescheduleDate}
                  onSelect={setRescheduleDate}
                  disabled={{ before: new Date() }}
                />
              </PopoverContent>
            </Popover>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setView("main")}>
                Back
              </Button>
              <Button
                onClick={handleReschedule}
                disabled={!rescheduleDate || loading}
              >
                Reschedule
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
