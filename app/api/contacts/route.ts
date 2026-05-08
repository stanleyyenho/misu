import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const contacts = await prisma.contact.findMany({
      where: { userId: user.id },
      include: {
        schedules: true,
        groups: { select: { groupId: true } },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });
    // Expose check-in schedule as `schedule` for backward compat with client components
    return NextResponse.json(
      contacts.map((c) => ({
        ...c,
        schedule: c.schedules.find((s) => s.scheduleType === "check-in") ?? null,
      }))
    );
  } catch (err) {
    console.error("[GET /api/contacts]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { firstName, lastName, email, phone, avatarUrl, messagingPlatform, notes, smsConsentAt } = body;

  if (!firstName) {
    return NextResponse.json({ error: "firstName is required" }, { status: 400 });
  }

  const contact = await prisma.contact.create({
    data: {
      userId: user.id,
      firstName,
      lastName,
      email,
      phone,
      avatarUrl,
      messagingPlatform,
      notes,
      smsConsentAt: smsConsentAt ? new Date(smsConsentAt) : undefined,
    },
  });

  revalidateTag("contacts", "max");

  return NextResponse.json(contact, { status: 201 });
}
