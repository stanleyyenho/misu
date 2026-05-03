import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!prisma.userProfile) {
    console.error("[GET /api/profile] prisma.userProfile is undefined — Prisma client needs regeneration");
    return NextResponse.json({ error: "Prisma client out of date" }, { status: 500 });
  }

  try {
    const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
    return NextResponse.json(profile ?? null);
  } catch (err) {
    console.error("[GET /api/profile]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { firstName, lastName, email, phone, onboardingComplete } = body as {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    onboardingComplete?: boolean;
  };

  if (firstName !== undefined && !String(firstName).trim()) {
    return NextResponse.json({ error: "firstName cannot be empty" }, { status: 400 });
  }

  if (!prisma.userProfile) {
    console.error("[PUT /api/profile] prisma.userProfile is undefined — Prisma client needs regeneration");
    return NextResponse.json({ error: "Prisma client out of date" }, { status: 500 });
  }

  try {
    const existing = await prisma.userProfile.findUnique({ where: { userId: user.id } });

    const profile = existing
      ? await prisma.userProfile.update({
          where: { userId: user.id },
          data: {
            ...(firstName !== undefined && { firstName: String(firstName).trim() }),
            ...(lastName !== undefined && { lastName: String(lastName).trim() }),
            ...(email !== undefined && { email: String(email).trim() }),
            ...(phone !== undefined && { phone: String(phone).trim() }),
            ...(onboardingComplete !== undefined && { onboardingComplete }),
          },
        })
      : await prisma.userProfile.create({
          data: {
            userId: user.id,
            firstName: String(firstName ?? "").trim(),
            lastName: String(lastName ?? "").trim(),
            email: String(email ?? user.email ?? "").trim(),
            phone: String(phone ?? user.phone ?? "").trim(),
            onboardingComplete: onboardingComplete ?? false,
          },
        });

    return NextResponse.json(profile);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[PUT /api/profile]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
