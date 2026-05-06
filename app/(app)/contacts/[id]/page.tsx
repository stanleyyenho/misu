"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ActionButton } from "@/components/ui/action-button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAvatarColor } from "@/lib/avatar-color";

const PLATFORM_LABELS: Record<string, string> = {
  sms: "SMS",
  imessage: "iMessage",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  messenger: "Messenger",
};

const MESSAGING_PLATFORMS = [
  { id: "imessage", label: "iMessage" },
  { id: "sms", label: "SMS" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "instagram", label: "Instagram" },
  { id: "messenger", label: "Messenger" },
];

interface Contact {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  messagingPlatform: string | null;
  notes: string | null;
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

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);

  // Editable fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [messagingPlatform, setMessagingPlatform] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch(`/api/contacts/${id}`);
    if (!res.ok) { router.push("/contacts"); return; }
    const data: Contact = await res.json();
    setContact(data);
    setFirstName(data.firstName);
    setLastName(data.lastName ?? "");
    setEmail(data.email ?? "");
    setPhone(data.phone ?? "");
    setMessagingPlatform(data.messagingPlatform ?? "");
    setNotes(data.notes ?? "");
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    if (!firstName.trim()) { toast.error("First name is required"); return; }
    setSaving(true);
    try {
      await fetch(`/api/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          messagingPlatform: messagingPlatform || null,
          notes: notes.trim() || null,
        }),
      });
      toast.success("Contact saved");
      load();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

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

  return (
    <div className="max-w-[480px] mx-auto">
      {/* Mobile top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-[#1F2024] md:hidden">
        <button onClick={() => router.back()} className="text-muted-foreground p-1 -ml-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="font-bold truncate">{name}</span>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        <div className="hidden md:flex items-center gap-2">
          <Link href="/contacts" className="text-sm text-muted-foreground hover:text-foreground font-semibold">
            ← Contacts
          </Link>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div
            className="h-16 w-16 rounded-full border-2 border-[#1F2024] flex items-center justify-center overflow-hidden shrink-0 crosshatch-light"
            style={{ backgroundColor: contact.avatarUrl ? undefined : color.bg, boxShadow: "3px 3px 0 #1F2024" }}
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
            <h1 className="text-xl font-bold">{name}</h1>
            {contact.messagingPlatform && (
              <span
                className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 border-2 border-[#1F2024]"
                style={{ borderRadius: "8px", backgroundColor: "var(--accent)", boxShadow: "1px 1px 0 #1F2024" }}
              >
                {PLATFORM_LABELS[contact.messagingPlatform] ?? contact.messagingPlatform}
              </span>
            )}
          </div>
        </div>

        <Separator />

        {/* Contact info form */}
        <section className="space-y-4">
          <h2 className="text-base font-bold">Contact info</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wide">First name</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={{ borderRadius: "8px" }}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wide">Last name</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={{ borderRadius: "8px" }}
              />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wide">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ borderRadius: "8px" }}
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wide">Phone</Label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ borderRadius: "8px" }}
            />
          </div>

          <div>
            <Label className="mb-2 block text-xs font-bold uppercase tracking-wide">Messaging platform</Label>
            <div className="flex flex-wrap gap-2">
              {MESSAGING_PLATFORMS.map((p) => (
                <PillButton
                  key={p.id}
                  active={messagingPlatform === p.id}
                  onClick={() => setMessagingPlatform(messagingPlatform === p.id ? "" : p.id)}
                >
                  {p.label}
                </PillButton>
              ))}
            </div>
          </div>
        </section>

        <Separator />

        {/* Context notes */}
        <section className="space-y-2">
          <h2 className="text-base font-bold">Context notes</h2>
          <p className="text-sm text-muted-foreground">
            Fed to the AI when generating messages — e.g. &ldquo;just had a baby&rdquo;, &ldquo;loves hiking&rdquo;
          </p>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Just moved to Austin, big Taylor Swift fan, we used to play ultimate frisbee together"
            rows={3}
            style={{ borderRadius: "8px" }}
          />
        </section>

        <ActionButton onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save contact"}
        </ActionButton>

        <Separator />

        <ActionButton variant="destructive" size="sm" onClick={handleDelete}>
          Delete contact
        </ActionButton>
      </div>
    </div>
  );
}
