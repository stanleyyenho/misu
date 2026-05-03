"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  schedule: { frequencyDays: number; nextCheckIn: string; isActive: boolean } | null;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/contacts").then((r) => r.json()).then(setContacts);
  }, []);

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.firstName.toLowerCase().includes(q) ||
      (c.lastName ?? "").toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 md:px-6 md:pt-6 md:pb-4 border-b md:border-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold">Contacts</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/contacts/import">
            <Button size="sm" className="rounded-full">Import</Button>
          </Link>
        </div>
        <Input
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-full"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-14 text-muted-foreground px-4 flex flex-col items-center gap-4">
            <FriendsIllustration size={100} />
            <div>
              <p className="font-bold text-foreground text-base">No contacts yet</p>
              <p className="text-sm mt-1">
                <Link href="/contacts/import" className="underline underline-offset-2 text-primary font-semibold">
                  Import your iOS contacts
                </Link>{" "}
                to get started
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y">
            {filtered.map((c) => {
              const name = [c.firstName, c.lastName].filter(Boolean).join(" ");
              const color = getAvatarColor(name);
              return (
                <li key={c.id}>
                  <Link
                    href={`/contacts/${c.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 active:bg-accent/40 md:hover:bg-accent/30 transition-colors"
                  >
                    <div
                      className="h-11 w-11 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
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
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{name}</p>
                      {c.email && (
                        <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {c.schedule?.isActive ? (
                        <Badge variant="secondary" className="text-xs rounded-full hidden sm:flex">
                          {format(new Date(c.schedule.nextCheckIn), "MMM d")}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground hidden sm:block">No schedule</span>
                      )}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth={2} className="text-muted-foreground">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
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
