"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ActionButton } from "@/components/ui/action-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

const PLATFORMS = [
  { id: "imessage", label: "iMessage" },
  { id: "sms", label: "SMS" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "instagram", label: "Instagram" },
  { id: "messenger", label: "Messenger" },
];

export default function NewContactPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [platform, setPlatform] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) { toast.error("First name is required"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          messagingPlatform: platform || null,
        }),
      });
      if (!res.ok) throw new Error();
      const contact = await res.json();
      toast.success(`${firstName} added!`);
      router.push(`/contacts/${contact.id}`);
    } catch {
      toast.error("Failed to create contact");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-[480px] mx-auto px-4 pt-5 pb-24">
      {/* Mobile top bar */}
      <div className="flex items-center gap-3 mb-6 md:hidden">
        <button onClick={() => router.back()} className="text-muted-foreground p-1 -ml-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <div className="hidden md:flex mb-6">
        <Link href="/contacts" className="text-sm text-muted-foreground hover:text-foreground font-semibold">
          ← Contacts
        </Link>
      </div>

      <p
        style={{
          fontFamily: "var(--font-pixel-display)",
          fontSize: "11px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--muted-foreground)",
        }}
      >
        new contact
      </p>
      <h1 className="text-xl font-semibold mt-0.5 mb-6" style={{ fontFamily: "var(--font-script)" }}>
        who do you want to stay in touch with?
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wide">First name *</Label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jordan"
              style={{ borderRadius: "8px" }}
              autoFocus
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wide">Last name</Label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Smith"
              style={{ borderRadius: "8px" }}
            />
          </div>
        </div>

        <div>
          <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wide">Phone number</Label>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 000 0000"
            style={{ borderRadius: "8px" }}
          />
        </div>

        <div>
          <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wide">Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jordan@example.com"
            style={{ borderRadius: "8px" }}
          />
        </div>

        <div>
          <Label className="mb-2 block text-xs font-bold uppercase tracking-wide">
            Preferred messaging platform
          </Label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlatform(platform === p.id ? "" : p.id)}
                className="text-sm font-bold px-3 py-1.5 border-2 border-[#1F2024] transition-all"
                style={{
                  borderRadius: "8px",
                  backgroundColor: platform === p.id ? "var(--button-fill)" : "transparent",
                  color: platform === p.id ? "#FFFFFF" : "#1F2024",
                  boxShadow: platform === p.id ? "2px 2px 0 #1F2024" : "none",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Used to determine how misu sends check-in messages
          </p>
        </div>

        <div className="pt-2">
          <ActionButton
            type="submit"
            disabled={saving || !firstName.trim()}
            className="w-full"
          >
            {saving ? "Adding..." : "Add contact"}
          </ActionButton>
          <p className="text-xs text-muted-foreground text-center mt-3">
            You can set up a check-in cadence on the next screen
          </p>
        </div>
      </form>
    </div>
  );
}
