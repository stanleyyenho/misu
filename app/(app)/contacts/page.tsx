"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { getAvatarColor } from "@/lib/avatar-color";
import { FriendsIllustration } from "@/components/illustrations/FriendsIllustration";

interface Contact {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  messagingPlatform: string | null;
  schedule: { frequencyDays: number; nextCheckIn: string; isActive: boolean } | null;
  groups: { groupId: string }[];
}

interface Group {
  id: string;
  name: string;
  members: { contactId: string }[];
}

const PLATFORM_LABELS: Record<string, string> = {
  sms: "SMS",
  imessage: "iMessage",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  messenger: "Messenger",
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/contacts").then((r) => r.json()).then(setContacts);
    fetch("/api/groups").then((r) => r.json()).then(setGroups);
  }, []);

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      c.firstName.toLowerCase().includes(q) ||
      (c.lastName ?? "").toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q);
    const matchesGroup = !activeGroup || c.groups?.some((g) => g.groupId === activeGroup);
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="flex flex-col h-full max-w-[480px] mx-auto">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b-2 border-[#1F2024] md:border-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p
              style={{
                fontFamily: "var(--font-pixel-display)",
                fontSize: "11px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--muted-foreground)",
              }}
            >
              your network
            </p>
            <h1 className="text-xl font-bold mt-0.5" style={{ fontFamily: "var(--font-script)" }}>
              contacts
            </h1>
          </div>
          <Link
            href="/contacts/new"
            className="text-sm font-bold px-4 py-2 border-2 border-[#1F2024] bg-[#1F2024] text-white transition-all hover:-translate-x-px hover:-translate-y-px active:translate-x-px active:translate-y-px"
            style={{ borderRadius: "8px", boxShadow: "2px 2px 0 #1F2024" }}
          >
            + Add
          </Link>
        </div>

        {/* Search */}
        <Input
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3"
          style={{ borderRadius: "8px" }}
        />

        {/* Group filter pills */}
        {groups.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
            <button
              onClick={() => setActiveGroup(null)}
              className={`shrink-0 text-xs font-bold px-3 py-1 border-2 border-[#1F2024] transition-all`}
              style={{
                borderRadius: "8px",
                backgroundColor: !activeGroup ? "#1F2024" : "transparent",
                color: !activeGroup ? "#FFFFFF" : "#1F2024",
                boxShadow: !activeGroup ? "1px 1px 0 #1F2024" : "none",
              }}
            >
              All
            </button>
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveGroup(activeGroup === g.id ? null : g.id)}
                className={`shrink-0 text-xs font-bold px-3 py-1 border-2 border-[#1F2024] transition-all`}
                style={{
                  borderRadius: "8px",
                  backgroundColor: activeGroup === g.id ? "var(--accent)" : "transparent",
                  color: "#1F2024",
                  boxShadow: activeGroup === g.id ? "1px 1px 0 #1F2024" : "none",
                }}
              >
                {g.name}
                <span className="ml-1 text-[10px] text-muted-foreground">
                  {g.members.length}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Contact count */}
      <p className="px-4 py-2 text-xs text-muted-foreground font-semibold">
        {filtered.length} contact{filtered.length !== 1 ? "s" : ""}
        {activeGroup && ` in ${groups.find((g) => g.id === activeGroup)?.name ?? ""}`}
      </p>

      {/* List */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-14 text-muted-foreground px-4 flex flex-col items-center gap-4">
            <FriendsIllustration size={100} />
            <div>
              <p className="font-bold text-foreground text-base">no contacts yet</p>
              <p className="text-sm mt-1">
                <Link href="/contacts/new" className="underline underline-offset-2 text-primary font-semibold">
                  Add your first contact
                </Link>{" "}
                or{" "}
                <Link href="/contacts/import" className="underline underline-offset-2 text-primary font-semibold">
                  import contacts
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-[#DEDEDE]">
            {filtered.map((c) => {
              const name = [c.firstName, c.lastName].filter(Boolean).join(" ");
              const color = getAvatarColor(name);
              return (
                <li key={c.id}>
                  <Link
                    href={`/contacts/${c.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 active:bg-accent/40 md:hover:bg-accent/20 transition-colors"
                  >
                    {/* Avatar */}
                    <div
                      className="h-11 w-11 rounded-full border-2 border-[#1F2024] flex items-center justify-center shrink-0 overflow-hidden crosshatch-light"
                      style={{ backgroundColor: c.avatarUrl ? undefined : color.bg }}
                    >
                      {c.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.avatarUrl} alt={name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold" style={{ color: color.fg }}>
                          {c.firstName[0]}{c.lastName?.[0] ?? ""}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {c.messagingPlatform && (
                          <span className="text-[10px] font-semibold text-muted-foreground">
                            {PLATFORM_LABELS[c.messagingPlatform] ?? c.messagingPlatform}
                          </span>
                        )}
                        {c.schedule?.isActive && (
                          <span className="text-[10px] text-muted-foreground">
                            next {format(new Date(c.schedule.nextCheckIn), "MMM d")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Schedule badge */}
                    {!c.schedule?.isActive && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 border border-[#DEDEDE] text-muted-foreground shrink-0"
                        style={{ borderRadius: "8px" }}
                      >
                        no cadence
                      </span>
                    )}

                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth={2} className="text-muted-foreground shrink-0">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
