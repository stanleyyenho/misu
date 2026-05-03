import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseVcf } from "@/lib/vcf";
import { getUser } from "@/lib/supabase/server";

interface NativeContact {
  name?: string[];
  tel?: { value: string }[];
  email?: { value: string }[];
}

async function importContacts(
  userId: string,
  contacts: { firstName: string; lastName?: string; email?: string; phone?: string; avatarUrl?: string }[]
) {
  let imported = 0;
  let skipped = 0;

  for (const c of contacts) {
    const existing = await prisma.contact.findFirst({
      where: {
        userId,
        firstName: c.firstName,
        lastName: c.lastName ?? null,
        phone: c.phone ?? null,
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.contact.create({
      data: {
        userId,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        avatarUrl: c.avatarUrl,
      },
    });
    imported++;
  }

  return { imported, skipped, total: contacts.length };
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = request.headers.get("content-type") ?? "";

  // Native device contacts (JSON array from Web Contacts API)
  if (contentType.includes("application/json")) {
    const body: NativeContact[] = await request.json();
    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json({ error: "No contacts provided" }, { status: 400 });
    }

    const contacts = body
      .map((c) => {
        const fullName = c.name?.[0]?.trim() ?? "";
        if (!fullName) return null;
        const parts = fullName.split(/\s+/);
        const firstName = parts[0];
        const lastName = parts.slice(1).join(" ") || undefined;
        return {
          firstName,
          lastName,
          phone: c.tel?.[0]?.value,
          email: c.email?.[0]?.value,
        };
      })
      .filter(Boolean) as { firstName: string; lastName?: string; phone?: string; email?: string }[];

    if (contacts.length === 0) {
      return NextResponse.json({ error: "No valid contacts found" }, { status: 400 });
    }

    const result = await importContacts(user.id, contacts);
    return NextResponse.json(result);
  }

  // VCF file upload
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const content = await file.text();
  const parsed = parseVcf(content);

  if (parsed.length === 0) {
    return NextResponse.json({ error: "No contacts found in file" }, { status: 400 });
  }

  const result = await importContacts(user.id, parsed);
  return NextResponse.json(result);
}
