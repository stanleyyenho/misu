import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
  return NextResponse.json(profile ?? null);
}

export async function PUT(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { firstName, lastName, email, phone, onboardingComplete } = body;

  if (firstName !== undefined && !firstName.trim()) {
    return NextResponse.json({ error: "firstName cannot be empty" }, { status: 400 });
  }

  const profile = await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: {
      ...(firstName !== undefined && { firstName: firstName.trim() }),
      ...(lastName !== undefined && { lastName: lastName.trim() }),
      ...(email !== undefined && { email: email.trim() }),
      ...(phone !== undefined && { phone: phone.trim() }),
      ...(onboardingComplete !== undefined && { onboardingComplete }),
    },
    create: {
      userId: user.id,
      firstName: (firstName ?? "").trim(),
      lastName: (lastName ?? "").trim(),
      email: (email ?? user.email ?? "").trim(),
      phone: (phone ?? user.phone ?? "").trim(),
      onboardingComplete: onboardingComplete ?? false,
    },
  });

  return NextResponse.json(profile);
}
