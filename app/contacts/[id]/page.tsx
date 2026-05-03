"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScheduleForm } from "@/components/ScheduleForm";
import { getAvatarColor } from "@/lib/avatar-color";

interface CheckIn {
  id: string;
  scheduledAt: string;
  completedAt: string | null;
  format: string | null;
  notes: string | null;
  status: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  schedule: {
    frequencyDays: number;
    catchupFormats: string;
    nextCheckIn: string;
    isActive: boolean;
  } | null;
  checkIns: CheckIn[];
}

const FORMAT_LABELS: Record<string, string> = {
  zoom: "Zoom", facetime: "FaceTime", "in-person": "In Person",
  phone: "Phone Call", whatsapp: "WhatsApp", text: "Text Message",
};

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);

  async function load() {
    const res = await fetch(`/api/contacts/${id}`);
    if (!res.ok) { router.push("/contacts"); return; }
    setContact(await res.json());
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete() {
    if (!confirm(`Delete ${contact?.firstName}? This cannot be undone.`)) return;
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    toast.success("Contact deleted");
    router.push("/contacts");
  }

  if (!contact) {
    return <div className="p-4 text-muted-foreground animate-pulse font-semibold">Loading...</div>;
  }

  const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
  const color = getAvatarColor(name);
  const pastCheckIns = contact.checkIns.filter((c) => c.status !== "pending").slice(-5).reverse();

  return (
    <div className="max-w-xl mx-auto">
      {/* Mobile top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b md:hidden">
        <button onClick={() => router.back()} className="text-muted-foreground p-1 -ml-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="font-bold truncate">{name}</span>
      </div>

      <div className="p-4 md:p-6">
        {/* Desktop back link */}
        <div className="hidden md:flex items-center gap-2 mb-6">
          <Link href="/contacts" className="text-sm text-muted-foreground hover:text-foreground font-semibold">
            ← Contacts
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center overflow-hidden shrink-0"
            style={{ backgroundColor: contact.avatarUrl ? undefined : color.bg }}
          >
            {contact.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={contact.avatarUrl} alt={name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-bold" style={{ color: color.fg }}>
                {contact.firstName[0]}{contact.lastName?.[0] ?? ""}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold">{name}</h1>
            {contact.email && <p className="text-sm text-muted-foreground">{contact.email}</p>}
            {contact.phone && <p className="text-sm text-muted-foreground">{contact.phone}</p>}
          </div>
        </div>

        {/* Current schedule */}
        {contact.schedule?.isActive && (
          <div className="mb-6 rounded-2xl border-l-4 border-l-primary/50 bg-secondary/50 p-4">
            <p className="text-sm font-bold">Current schedule</p>
            <p className="text-sm text-muted-foreground mt-1">
              Every {contact.schedule.frequencyDays} days · Next:{" "}
              <span className="font-bold text-foreground">
                {format(new Date(contact.schedule.nextCheckIn), "MMM d, yyyy")}
              </span>
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {(JSON.parse(contact.schedule.catchupFormats) as string[]).map((f) => (
                <Badge key={f} variant="secondary" className="text-xs rounded-full">
                  {FORMAT_LABELS[f] ?? f}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator className="my-5" />

        <section>
          <h2 className="text-base font-bold mb-4">
            {contact.schedule?.isActive ? "Edit schedule" : "Set a schedule"}
          </h2>
          <ScheduleForm
            contactId={id}
            initialFrequencyDays={contact.schedule?.isActive ? contact.schedule.frequencyDays : undefined}
            initialFormats={contact.schedule?.isActive ? JSON.parse(contact.schedule.catchupFormats) : []}
            onSaved={load}
          />
        </section>

        {pastCheckIns.length > 0 && (
          <>
            <Separator className="my-5" />
            <section>
              <h2 className="text-base font-bold mb-4">Recent check-ins</h2>
              <ul className="space-y-3">
                {pastCheckIns.map((ci) => (
                  <li key={ci.id} className="flex items-start gap-3 text-sm">
                    <Badge
                      variant={ci.status === "completed" ? "default" : "outline"}
                      className="shrink-0 mt-0.5 rounded-full"
                    >
                      {ci.status}
                    </Badge>
                    <div>
                      <p className="font-semibold">{format(new Date(ci.scheduledAt), "MMM d, yyyy")}</p>
                      {ci.format && <p className="text-muted-foreground text-xs">via {FORMAT_LABELS[ci.format] ?? ci.format}</p>}
                      {ci.notes && <p className="text-muted-foreground text-xs italic">{ci.notes}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        <Separator className="my-5" />
        <Button variant="destructive" size="sm" onClick={handleDelete}>Delete contact</Button>
      </div>
    </div>
  );
}
