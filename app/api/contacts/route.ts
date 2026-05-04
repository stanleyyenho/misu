import { NextResponse } from "next/server";
import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

const fetchContacts = unstable_cache(
  async (userId: string) => {
    return prisma.contact.findMany({
      where: { userId },
      include: {
        schedule: true,
        groups: { select: { groupId: true } },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });
  },
  ["contacts"],
  { tags: ["contacts"], revalidate: 300 }
);

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(await fetchContacts(user.id));
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { firstName, lastName, email, phone, avatarUrl, messagingPlatform, notes } = body;

  if (!firstName) {
    return NextResponse.json({ error: "firstName is required" }, { status: 400 });
  }

  const contact = await prisma.contact.create({
    data: { userId: user.id, firstName, lastName, email, phone, avatarUrl, messagingPlatform, notes },
  });

  revalidateTag("contacts", "max");

  return NextResponse.json(contact, { status: 201 });
}
