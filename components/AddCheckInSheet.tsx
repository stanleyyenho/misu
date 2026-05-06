"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getAvatarColor } from "@/lib/avatar-color";
import { ScheduleForm } from "@/components/ScheduleForm";

interface ContactOption {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  messagingPlatform: string | null;
  schedule: {
    frequencyDays: number;
    tone: string;
    approveBeforeSend: boolean;
    leadTimeDays: number;
    cadenceMode: string;
    isActive: boolean;
  } | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function AddCheckInSheet({ open, onOpenChange, onSaved }: Props) {
  const { data: contacts = [] } = useSWR<ContactOption[]>(open ? "/api/contacts" : null, fetcher);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ContactOption | null>(null);

  function handleClose() {
    setSelected(null);
    setSearch("");
    onOpenChange(false);
  }

  function handleSaved() {
    handleClose();
    onSaved();
  }

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.firstName.toLowerCase().includes(q) ||
      (c.lastName ?? "").toLowerCase().includes(q)
    );
  });

  const existingSchedule =
    selected?.schedule?.isActive && selected.schedule.cadenceMode === "prompt"
      ? selected.schedule
      : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selected ? "Set up check-in messages" : "Who do you want to stay in touch with?"}
          </DialogTitle>
        </DialogHeader>

        {!selected ? (
          <div className="space-y-3 pt-1">
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              style={{ borderRadius: "8px" }}
            />
            <ul className="space-y-1 max-h-60 overflow-y-auto">
              {filtered.map((c) => {
                const name = [c.firstName, c.lastName].filter(Boolean).join(" ");
                const color = getAvatarColor(name);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(c)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] hover:bg-accent/30 transition-colors text-left"
                    >
                      <div
                        className="h-8 w-8 rounded-full border-2 border-[#1F2024] flex items-center justify-center shrink-0 crosshatch-light"
                        style={{ backgroundColor: color.bg }}
                      >
                        <span className="text-xs font-bold" style={{ color: color.fg }}>
                          {c.firstName[0]}{c.lastName?.[0] ?? ""}
                        </span>
                      </div>
                      <span className="font-semibold text-sm">{name}</span>
                      {c.schedule?.isActive && c.schedule.cadenceMode === "prompt" && (
                        <span className="ml-auto text-[10px] text-muted-foreground font-semibold">active</span>
                      )}
                    </button>
                  </li>
                );
              })}
              {filtered.length === 0 && (
                <li className="text-sm text-muted-foreground text-center py-4">No contacts found</li>
              )}
            </ul>
          </div>
        ) : (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
            >
              ← Back
            </button>
            <ScheduleForm
              sectionMode="check-in"
              contactId={selected.id}
              contactPhone={selected.phone}
              contactPlatform={selected.messagingPlatform}
              initialFrequencyDays={existingSchedule?.frequencyDays}
              initialTone={existingSchedule?.tone ?? "casual"}
              initialApproveBeforeSend={existingSchedule?.approveBeforeSend ?? true}
              initialLeadTimeDays={existingSchedule?.leadTimeDays ?? 7}
              onSaved={handleSaved}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
