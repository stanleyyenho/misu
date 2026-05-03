import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseVcf } from "@/lib/vcf";
import { getUser } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  let imported = 0;
  let skipped = 0;

  for (const c of parsed) {
    const existing = await prisma.contact.findFirst({
      where: {
        userId: user.id,
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
        userId: user.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        avatarUrl: c.avatarUrl,
      },
    });
    imported++;
  }

  return NextResponse.json({ imported, skipped, total: parsed.length });
}
