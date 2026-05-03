import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const deleted = await prisma.contactGroup.deleteMany({ where: { id, userId: user.id } });
  if (deleted.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}

// Add / remove a contact from the group
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: groupId } = await params;

  const owned = await prisma.contactGroup.findFirst({ where: { id: groupId, userId: user.id } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { contactId, action } = await request.json();

  if (!contactId || !["add", "remove"].includes(action)) {
    return NextResponse.json({ error: "contactId and action (add|remove) required" }, { status: 400 });
  }

  if (action === "add") {
    await prisma.contactGroupMember.upsert({
      where: { contactId_groupId: { contactId, groupId } },
      create: { contactId, groupId },
      update: {},
    });
  } else {
    await prisma.contactGroupMember.deleteMany({ where: { contactId, groupId } });
  }

  return NextResponse.json({ success: true });
}
